import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateStickerOrderDto,
  OrderItemDto,
  PartOrderItemDto,
  UpdateStatusDto,
  ShippingAddressDto,
} from './dto/order.dto';
import { DiscountService } from 'src/discounts/discount.service';
import { PartsService } from 'src/parts/parts.service';
import { MailService } from 'src/mail/mail.service';
import { NotificationService } from 'src/notifications/notification.service';
import { UpsService } from './ups.service';
import { PostService } from './post.service';
import {
  sticker_order_status_enum,
  Prisma,
  discount_type_enum,
  shipping_carrier_enum,
} from '@prisma/client';

@Injectable()
export class StickerOrderService {
  private readonly logger = new Logger(StickerOrderService.name);

  // sizes in mm
  private readonly cartonSizes = [
    { length: 200, width: 100, height: 100, type: 'small' },
    { length: 265, width: 235, height: 140, type: 'medium' },
    { length: 350, width: 350, height: 140, type: 'large' },
    { length: 450, width: 320, height: 300, type: 'xlarge' },
  ];

  private readonly priceSettings = {
    additionalPriceVinyl: 2,
    additionalPricePrintable: 2,
    basePriceCustomCm2: 0.05,
    additionalPriceCustom: 2,

    //only for Switzerland: free shipping for orders above 100 CHF after discounts
    freeShippingThreshold: 100,
    // Letter shipment: max 2cm x 25cm x 35cm
    shippingCostLetter: 2.9,
    // Parcel shipment: larger than letter format
    shippingCostBig: 9,

    // Packaging weight added on top of item weights to ensure the declared
    // weight is never lower than the real packed weight.
    // ~50 g for a padded envelope (letters), ~250 g for a carton + padding (parcels).
    packagingWeightLetterKg: 0.05,
    packagingWeightParcelKg: 0.25,
  };
  constructor(
    private readonly prisma: PrismaService,
    private readonly discountService: DiscountService,
    private readonly partsService: PartsService,
    private readonly mailService: MailService,
    private readonly notificationService: NotificationService,
    private readonly upsService: UpsService,
    private readonly postService: PostService,
  ) {}

  /**
   * Creates a new sticker order
   */
  async create(createStickerOrderDto: CreateStickerOrderDto) {
    const {
      userId,
      guestEmail,
      orderItems,
      partOrderItems = [],
      shipmentCost: providedShipmentCost,
      shipmentCarrier,
      ...orderData
    } = createStickerOrderDto;

    let validatedDiscount: {
      type: discount_type_enum;
      value: number;
      id: string;
    };
    let discountAmount = 0;
    let shippingCost = 0;
    const stickersPrice = 0;
    let partsPrice = 0;

    if (createStickerOrderDto.discountCode) {
      validatedDiscount = await this.discountService.validateCode(
        createStickerOrderDto.discountCode,
        true,
      );
    }

    // Calculate shipping cost based on sticker and part dimensions
    // Letter shipment: max 2cm x 25cm x 35cm (thickness assumed for flat items)
    // Start with letter cost, upgrade to parcel if any item is too large
    shippingCost = this.priceSettings.shippingCostLetter;
    const derivedCarrier: shipping_carrier_enum =
      shipping_carrier_enum.swiss_post;
    for (const item of createStickerOrderDto.orderItems) {
      if (
        Math.max(item.height, item.width) > 35 ||
        Math.min(item.height, item.width) > 25
      ) {
        shippingCost = this.priceSettings.shippingCostBig;
        break; // Once we need parcel, no need to check further
      }
    }

    // Check part dimensions
    if (shippingCost !== this.priceSettings.shippingCostBig) {
      for (const item of partOrderItems) {
        const part = await this.partsService.findOne(item.partId);

        // If any dimension or weight is 0, use parcel shipping
        if (
          !part.width ||
          Number(part.width) === 0 ||
          !part.height ||
          Number(part.height) === 0 ||
          !part.length ||
          Number(part.length) === 0 ||
          !part.weight ||
          Number(part.weight) === 0
        ) {
          shippingCost = this.priceSettings.shippingCostBig;
          break;
        }

        // If weight is more than 1kg, use parcel shipping
        if (Number(part.weight) > 1000) {
          shippingCost = this.priceSettings.shippingCostBig;
          break;
        }

        // Check if dimensions exceed letter limits
        if (
          part.width &&
          part.height &&
          (Math.max(Number(part.height), Number(part.width)) > 35 ||
            Math.min(Number(part.height), Number(part.width)) > 25)
        ) {
          shippingCost = this.priceSettings.shippingCostBig;
          break;
        }
      }
    }

    // If the caller pre-calculated the shipping cost (e.g. via calculatePrice which uses
    // UPS/Swiss Post APIs for international orders), use that value directly so the stored
    // shipmentCost matches what was actually charged via Stripe.
    if (providedShipmentCost !== undefined && providedShipmentCost >= 0) {
      shippingCost = providedShipmentCost;
    }

    // Final carrier: prefer the value passed in from the DTO (comes from calculatePrice for
    // international orders), otherwise use the value derived from the domestic logic above.
    const finalCarrier: shipping_carrier_enum =
      shipmentCarrier ?? derivedCarrier;

    // Calculate price of each part item
    let partsWithoutInitialPrice = 0;
    const partsWithInitialPriceDetails: Array<{
      itemPrice: number;
      initialPrice: number;
      quantity: number;
      betterWithDiscount: boolean;
    }> = [];

    for (const item of partOrderItems) {
      const part = await this.partsService.findOne(item.partId);
      const itemPrice = part.price * item.quantity;
      partsPrice += itemPrice;

      // Separate parts with and without initialPrice for discount calculation
      if (part.initialPrice && part.initialPrice > 0) {
        partsWithInitialPriceDetails.push({
          itemPrice,
          initialPrice: part.initialPrice * item.quantity,
          quantity: item.quantity,
          betterWithDiscount: false, // Will be determined later
        });
      } else {
        partsWithoutInitialPrice += itemPrice;
      }
    }

    // Calculate total items price - initially use normal prices for all items
    let finalDiscountAmount = 0;

    // Calculate discount amount from discount code using normal prices
    if (validatedDiscount) {
      if (validatedDiscount.type === 'percentage') {
        // Calculate discount amount for stickers
        const stickersDiscountAmount =
          this.discountService.calculateDiscountAmount(
            stickersPrice,
            validatedDiscount.type,
            validatedDiscount.value,
          );

        let partsDiscountAmount = 0;

        // Handle parts with initial prices using the new logic
        for (const partDetail of partsWithInitialPriceDetails) {
          // Calculate what the initial price would be with discount applied
          const initialPriceWithDiscount =
            partDetail.initialPrice * (1 - validatedDiscount.value / 100);

          // Always use the best price among: current price, initial price with discount
          if (initialPriceWithDiscount < partDetail.itemPrice) {
            // Initial price with discount is better than current price
            // Track the discount amount (difference between initial price and discounted initial price)
            partsDiscountAmount +=
              partDetail.initialPrice - initialPriceWithDiscount;
          } else {
            // Current price is better than or equal to initial price with discount
            // Apply discount to current price
            const currentPriceDiscount =
              this.discountService.calculateDiscountAmount(
                partDetail.itemPrice,
                validatedDiscount.type,
                validatedDiscount.value,
              );
            partsDiscountAmount += currentPriceDiscount;
          }
        }

        // Add discount for parts without initial prices
        const partsWithoutInitialPriceDiscount =
          this.discountService.calculateDiscountAmount(
            partsWithoutInitialPrice,
            validatedDiscount.type,
            validatedDiscount.value,
          );
        partsDiscountAmount += partsWithoutInitialPriceDiscount;

        finalDiscountAmount = stickersDiscountAmount + partsDiscountAmount;
        discountAmount = finalDiscountAmount;
      } else {
        // For fixed discounts, use best prices for parts (initial vs current)
        let optimizedPartsPrice = 0;

        // For parts with initial prices, use the better of current price vs initial price
        for (const partDetail of partsWithInitialPriceDetails) {
          // For fixed discounts, compare current price vs initial price without discount
          if (partDetail.initialPrice < partDetail.itemPrice) {
            // Initial price is better than current price
            optimizedPartsPrice += partDetail.initialPrice;
          } else {
            // Current price is better than or equal to initial price
            optimizedPartsPrice += partDetail.itemPrice;
          }
        }

        // Add parts without initial prices at normal price
        optimizedPartsPrice += partsWithoutInitialPrice;

        // Calculate fixed discount amount on the optimized total
        const optimizedTotalItemsPrice = stickersPrice + optimizedPartsPrice;

        finalDiscountAmount = this.discountService.calculateDiscountAmount(
          optimizedTotalItemsPrice,
          validatedDiscount.type,
          validatedDiscount.value,
        );
        discountAmount = finalDiscountAmount;
      }
    } else {
      // No discount code applied - use normal prices for all parts
      discountAmount = 0;
    }

    // Calculate final price using original prices, then subtract discount
    const finalTotalItemsPrice = stickersPrice + partsPrice;

    // Subtract the discount amount from total items price
    const discountedItemsPrice = finalTotalItemsPrice - discountAmount;

    // Apply free shipping if discount code is free_shipping type
    if (validatedDiscount && validatedDiscount.type === 'free_shipping') {
      shippingCost = 0;
    }
    // Check if order is eligible for free shipping based on discounted price
    else if (discountedItemsPrice >= this.priceSettings.freeShippingThreshold) {
      shippingCost = 0;
    }

    const totalPrice = discountedItemsPrice + shippingCost;

    // Validate stock for dropdown options in parts before creating order
    for (const item of partOrderItems) {
      if (
        item.customizationOptions &&
        Array.isArray(item.customizationOptions)
      ) {
        for (
          let optionIndex = 0;
          optionIndex < item.customizationOptions.length;
          optionIndex++
        ) {
          const option = item.customizationOptions[optionIndex];

          if (option.type === 'dropdown' && option.value) {
            // Use the array index as optionId (converted to string)
            const optionId = optionIndex.toString();

            try {
              const stockInfo = await this.partsService.getOptionStock(
                item.partId,
                optionId,
                option.value,
              );

              if (stockInfo.length > 0) {
                const currentStock = stockInfo[0].quantity;
                if (currentStock < item.quantity) {
                  throw new BadRequestException(
                    `Insufficient stock for part option. Available: ${currentStock}, Required: ${item.quantity}`,
                  );
                }
              }
              // If no stock record exists, we allow the order (stock tracking is optional)
            } catch (error) {
              if (error instanceof BadRequestException) {
                throw error; // Re-throw stock validation errors
              }
            }
          }
        }
      }
    }

    // Create order
    try {
      // Prepare sticker order items
      const orderItemsData = await Promise.all(
        orderItems.map(async (item) => {
          // For custom stickers, create a new custom_sticker record
          let customStickerId = null;
          if (item.customSticker) {
            const customSticker = await this.prisma.custom_sticker.create({
              data: {
                image: item.customSticker.image,
                originalImages: item.customSticker.originalImages || [],
              },
            });
            customStickerId = customSticker.id;
          }

          return {
            width: item.width,
            height: item.height,
            vinyl: item.vinyl || false,
            printed: item.printed || false,
            quantity: item.quantity,
            stickerId: item.stickerId || null,
            customStickerId: customStickerId,
            customizationOptions: JSON.stringify(
              Array.isArray(item.customizationOptions)
                ? item.customizationOptions
                : [],
            ),
          };
        }),
      );

      // Prepare part order items
      const partOrderItemsData = await Promise.all(
        partOrderItems.map(async (item) => {
          return {
            partId: item.partId,
            quantity: item.quantity,
            customizationOptions: JSON.stringify(
              Array.isArray(item.customizationOptions)
                ? item.customizationOptions
                : [],
            ),
          };
        }),
      );

      // Create order with all related data
      const order = await this.prisma.sticker_order.create({
        data: {
          // Order details
          firstName: orderData.firstName,
          lastName: orderData.lastName,
          email: orderData.email,
          phone: orderData.phone,
          street: orderData.street,
          houseNumber: orderData.houseNumber,
          zipCode: orderData.zipCode,
          city: orderData.city,
          country: orderData.country,
          additionalAddressInfo: orderData.additionalAddressInfo,
          paymentMethod: orderData.paymentMethod,
          comment: orderData.comment,
          paymentId: orderData.paymentId,

          // User connection - either registered user or guest
          ...(userId
            ? {
                user: {
                  connect: { id: userId },
                },
              }
            : {}),
          guestEmail: guestEmail || null,

          // Pricing details
          totalPrice: totalPrice,
          shipmentCost: shippingCost,
          shipmentCarrier: finalCarrier,

          // Discount connection if provided
          ...(validatedDiscount && {
            discount: {
              connect: { id: validatedDiscount.id },
            },
          }),

          // Create sticker order items
          items: {
            create: orderItemsData,
          },

          // Create part order items
          partItems: {
            create: partOrderItemsData,
          },
        },
        include: {
          items: {
            include: {
              sticker: {
                include: {
                  translations: true,
                },
              },
              customSticker: true,
            },
          },
          partItems: {
            include: {
              part: {
                include: {
                  translations: true,
                },
              },
            },
          },
          discount: true,
        },
      });

      // Send push notification to admins about new order
      try {
        await this.notificationService.sendToAdmins({
          title: '🛒 New Order Received!',
          body: `Order from ${order.firstName} ${order.lastName} - CHF${order.totalPrice.toFixed(2)}`,
          data: {
            orderId: order.id,
            totalPrice: order.totalPrice.toString(),
            customerName: `${order.firstName} ${order.lastName}`,
            orderDate: order.orderDate.toISOString(),
          },
          icon: '/icon.png',
          badge: '/badge.png',
        });
        this.logger.log(`Push notification sent for order ${order.id}`);
      } catch (notificationError) {
        this.logger.error(
          `Failed to send push notification for order ${order.id}: ${notificationError.message}`,
        );
        // Don't throw error - order creation should not fail because of notification issues
      }

      return order;
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`);
      if (error.code === 'P2002') {
        throw new BadRequestException('Duplicate entry in order');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid reference ID provided in order');
      }
      throw new BadRequestException(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Finds all orders with pagination
   * Admin can see all orders, users can only see their own
   */
  async findAll(
    userId?: string,
    page = 1,
    limit = 10,
    status?: sticker_order_status_enum,
  ) {
    // Ensure page and limit are valid numbers
    const safePage = typeof page === 'number' && !isNaN(page) ? page : 1;
    const safeLimit = typeof limit === 'number' && !isNaN(limit) ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    // Build filter conditions
    const where: Prisma.sticker_orderWhereInput = {};

    // Filter by user if userId is provided
    if (userId) {
      if (this.prisma.user.findUnique({ where: { id: userId } }) === null) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      where.userId = userId;
    }

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Get total count for pagination
    const total = await this.prisma.sticker_order.count({ where });

    // Fetch paginated orders
    const orders = await this.prisma.sticker_order.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        orderDate: 'desc',
      },
      include: {
        items: {
          include: {
            sticker: {
              include: {
                translations: true,
              },
            },
            customSticker: true,
          },
        },
        partItems: {
          include: {
            part: {
              include: {
                translations: true,
              },
            },
          },
        },
        discount: true,
      },
    });

    const parsedOrders = await this.enrichOrders(orders);

    return {
      parsedOrders,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  /**
   * Find orders for a specific user
   */
  async findUserOrders(
    userId: string,
    page = 1,
    limit = 10,
    status?: sticker_order_status_enum,
  ) {
    return this.findAll(userId, page, limit, status);
  }

  /**
   * Search orders across customer details and ordered items
   */
  async searchOrders(query: string, page = 1, limit = 10) {
    const safePage = typeof page === 'number' && !isNaN(page) ? page : 1;
    const safeLimit = typeof limit === 'number' && !isNaN(limit) ? limit : 10;
    const skip = (safePage - 1) * safeLimit;

    const words = query.split(/\s+/).filter((w) => w.length > 0);

    const buildFieldConditions = (
      term: string,
    ): Prisma.sticker_orderWhereInput[] => [
      { id: { contains: term, mode: 'insensitive' } },
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { guestEmail: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term, mode: 'insensitive' } },
      { street: { contains: term, mode: 'insensitive' } },
      { city: { contains: term, mode: 'insensitive' } },
      { zipCode: { contains: term, mode: 'insensitive' } },
      { country: { contains: term, mode: 'insensitive' } },
      { comment: { contains: term, mode: 'insensitive' } },
      { paymentId: { contains: term, mode: 'insensitive' } },
      { user: { email: { contains: term, mode: 'insensitive' } } },
      {
        items: {
          some: {
            sticker: {
              translations: {
                some: { title: { contains: term, mode: 'insensitive' } },
              },
            },
          },
        },
      },
      {
        partItems: {
          some: {
            part: {
              translations: {
                some: { title: { contains: term, mode: 'insensitive' } },
              },
            },
          },
        },
      },
    ];

    // Every word must match at least one field (AND of words, OR of fields per word)
    const where: Prisma.sticker_orderWhereInput = {
      AND: words.map((word) => ({ OR: buildFieldConditions(word) })),
    };

    let total = await this.prisma.sticker_order.count({ where });

    const orderInclude = {
      items: {
        include: {
          sticker: { include: { translations: true } },
          customSticker: true,
        },
      },
      partItems: {
        include: {
          part: { include: { translations: true } },
        },
      },
      discount: true,
    };

    let orders = await this.prisma.sticker_order.findMany({
      where,
      skip,
      take: safeLimit,
      orderBy: { orderDate: 'desc' },
      include: orderInclude,
    });

    // If strict AND search found nothing and we have multiple words,
    // fall back to OR search (any word matches any field) for partial matches
    let fuzzyFallback = false;
    if (total === 0 && words.length > 1) {
      const fallbackWhere: Prisma.sticker_orderWhereInput = {
        OR: words.flatMap((word) => buildFieldConditions(word)),
      };
      total = await this.prisma.sticker_order.count({
        where: fallbackWhere,
      });
      orders = await this.prisma.sticker_order.findMany({
        where: fallbackWhere,
        skip,
        take: safeLimit,
        orderBy: { orderDate: 'desc' },
        include: orderInclude,
      });
      fuzzyFallback = true;
    }

    const parsedOrders = await this.enrichOrders(orders);

    return {
      parsedOrders,
      fuzzyFallback,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  private async enrichOrders(orders: any[]) {
    const partIds = new Set<string>();

    orders.forEach((order) => {
      order.partItems.forEach((item) => {
        if (item.partId) partIds.add(item.partId);
      });
    });

    const parts = await Promise.all(
      Array.from(partIds).map((id) => this.partsService.findOne(id)),
    );

    const partMap = parts.reduce((map, part) => {
      map[part.id] = part;
      return map;
    }, {});

    return orders.map((order) => ({
      ...order,
      items: order.items.map((item) => {
        const customOptions =
          typeof item.customizationOptions === 'string'
            ? JSON.parse(item.customizationOptions)
            : item.customizationOptions || [];

        return { ...item, customizationOptions: customOptions };
      }),
      partItems: order.partItems.map((item) => {
        let customOptions =
          typeof item.customizationOptions === 'string'
            ? JSON.parse(item.customizationOptions)
            : item.customizationOptions || [];

        if (item.partId && partMap[item.partId] && customOptions.length > 0) {
          const part = partMap[item.partId];
          const partOptions =
            typeof part.customizationOptions === 'string'
              ? JSON.parse(part.customizationOptions)
              : part.customizationOptions;

          if (partOptions && partOptions.options) {
            customOptions = customOptions.map((option) => {
              if (
                option.type === 'dropdown' &&
                option.value &&
                option.optionId !== undefined
              ) {
                const dropdownOption =
                  partOptions.options[parseInt(option.optionId, 10)];
                if (dropdownOption && dropdownOption.items) {
                  const selectedItem = dropdownOption.items.find(
                    (item) => item.id === option.value,
                  );
                  if (selectedItem && selectedItem.translations) {
                    return {
                      ...option,
                      translations: selectedItem.translations,
                    };
                  }
                }
              }
              return option;
            });
          }
        }

        return { ...item, customizationOptions: customOptions };
      }),
    }));
  }

  /**
   * Find a specific order by ID
   */
  async findOne(id: string, userId?: string) {
    const order = await this.prisma.sticker_order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            sticker: {
              include: {
                translations: true,
              },
            },
            customSticker: true,
          },
        },
        partItems: {
          include: {
            part: {
              include: {
                translations: true,
              },
            },
          },
        },
        discount: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // If userId is provided, check if the order belongs to the user
    if (userId && order.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to view this order',
      );
    }

    order.items = order.items.map((item) => ({
      ...item,
      customizationOptions:
        typeof item.customizationOptions === 'string'
          ? JSON.parse(item.customizationOptions)
          : item.customizationOptions,
    }));

    order.partItems = order.partItems.map((item) => ({
      ...item,
      customizationOptions:
        typeof item.customizationOptions === 'string'
          ? JSON.parse(item.customizationOptions)
          : item.customizationOptions,
    }));

    return order;
  }
  /**
   * Update order status (admin only)
   */
  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    await this.findOne(id); // Check if order exists

    const updatedOrder = await this.prisma.sticker_order.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
      include: {
        items: {
          include: {
            sticker: {
              include: {
                translations: true,
              },
            },
            customSticker: true,
          },
        },
        partItems: {
          include: {
            part: {
              include: {
                translations: true,
              },
            },
          },
        },
        discount: true,
      },
    });

    // Send shipping notification email when order status is set to completed
    if (updateStatusDto.status === sticker_order_status_enum.completed) {
      try {
        await this.sendShippingNotificationEmail(updatedOrder);
      } catch (error) {
        this.logger.error(
          `Failed to send shipping notification email for order ${id}:`,
          error,
        );
        // Don't fail the status update if email sending fails
      }
    }

    return updatedOrder;
  }
  /**
   * Mark order as paid (user only)
   */
  async paymentSuccess(orderId: string, paymentId: string) {
    const order = await this.prisma.sticker_order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            sticker: {
              include: {
                translations: true,
              },
            },
          },
        },
        partItems: {
          include: {
            part: {
              include: {
                translations: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== sticker_order_status_enum.stand) {
      throw new BadRequestException('Order is already paid or cancelled');
    }
    const updatedOrder = await this.prisma.sticker_order.update({
      where: { id: order.id },
      data: {
        status: sticker_order_status_enum.pending,
        paymentId: paymentId,
      },
      include: {
        items: {
          include: {
            sticker: {
              include: {
                translations: true,
              },
            },
          },
        },
        partItems: {
          include: {
            part: {
              include: {
                translations: true,
              },
            },
          },
        },
      },
    });

    // Now that payment is successful and status is "pending", increment sold counters and decrement stock

    // Increment sold counter for each part in the order and handle option stock
    for (const item of updatedOrder.partItems) {
      await this.partsService.incrementSold(item.partId, item.quantity);

      // Decrement the main quantity of the part
      await this.partsService.decrementQuantity(item.partId, item.quantity);

      // Parse customization options to handle stock decrementing for dropdown options
      let customizationOptions = item.customizationOptions;
      if (typeof customizationOptions === 'string') {
        try {
          customizationOptions = JSON.parse(customizationOptions);
        } catch (error) {
          this.logger.warn(
            `Failed to parse customizationOptions for part item ${item.id}: ${error.message}`,
          );
          continue;
        }
      }

      // Handle stock decrementing for dropdown options if they exist
      if (customizationOptions && Array.isArray(customizationOptions)) {
        for (
          let optionIndex = 0;
          optionIndex < customizationOptions.length;
          optionIndex++
        ) {
          const option = customizationOptions[optionIndex];
          const optionObj = option as any; // Type cast to handle JsonValue
          if (optionObj.type === 'dropdown' && optionObj.value) {
            // Use the array index as optionId (converted to string)
            const optionId = optionIndex.toString();
            try {
              await this.partsService.decrementOptionStock(
                item.partId,
                optionId,
                optionObj.value,
                item.quantity,
              );
            } catch (error) {
              this.logger.warn(
                `Could not decrement stock for dropdown option: ${error.message}`,
              );
              // Continue processing - this is not a critical failure for the order
            }
          }
        }
      }
    }

    // Send order confirmation email after successful payment
    try {
      const customerEmail = updatedOrder.email || updatedOrder.guestEmail;
      if (customerEmail) {
        await this.mailService.sendOrderConfirmationEmail({
          email: customerEmail,
          firstName: updatedOrder.firstName,
          lastName: updatedOrder.lastName,
          orderId: updatedOrder.id,
          totalPrice: updatedOrder.totalPrice.toNumber(),
          orderItems: updatedOrder.items.map((item) => ({
            quantity: item.quantity,
            width: item.width?.toNumber(),
            height: item.height?.toNumber(),
            vinyl: item.vinyl,
            printed: item.printed,
            stickerId: item.stickerId,
            stickerName:
              item.sticker?.translations?.find((t) => t.language === 'de')
                ?.title ||
              item.sticker?.translations?.[0]?.title ||
              undefined,
            stickerImages: item.sticker?.images || [],
            customizationOptions:
              typeof item.customizationOptions === 'string'
                ? JSON.parse(item.customizationOptions)
                : item.customizationOptions,
          })),
          partOrderItems: updatedOrder.partItems.map((item) => ({
            quantity: item.quantity,
            partId: item.partId,
            partName:
              item.part?.translations?.find((t) => t.language === 'de')
                ?.title ||
              item.part?.translations?.[0]?.title ||
              `Teil ${item.partId}`,
            partImages: item.part?.images || [],
            customizationOptions:
              typeof item.customizationOptions === 'string'
                ? JSON.parse(item.customizationOptions)
                : item.customizationOptions,
          })),
        });
        this.logger.log(
          `Order confirmation email sent to: ${customerEmail} for order ${updatedOrder.id}`,
        );
      } else {
        this.logger.warn(
          `No email address available for order confirmation: ${updatedOrder.id}`,
        );
      }
    } catch (emailError) {
      this.logger.error(
        `Failed to send order confirmation email for order ${updatedOrder.id}: ${emailError.message}`,
      );
      // Don't throw error here - payment success should not fail because of email issues
    }

    return updatedOrder;
  }

  /**
   * Calculate the total price and shipping cost for given order items without creating an order
   */
  async calculatePrice(
    orderItems: OrderItemDto[],
    partOrderItems: PartOrderItemDto[] = [],
    discountCode?: string,
    shippingAddress?: ShippingAddressDto,
  ) {
    let validatedDiscount: {
      type: discount_type_enum;
      value: number;
      id: string;
    };
    let discountAmount = 0;
    let shippingCost = 0;
    let selectedCarrier: shipping_carrier_enum | null = null;
    let stickersPrice = 0;
    let partsPrice = 0;

    if (discountCode) {
      validatedDiscount = await this.discountService.validateCode(
        discountCode,
        false, // Changed to false to avoid incrementing usage when just calculating
      );
    }

    // Check if shipping address is international (not Switzerland)
    const isInternational =
      shippingAddress && shippingAddress.country.toUpperCase() !== 'CH';

    // Calculate shipping cost
    if (isInternational) {
      const countryCode = shippingAddress.country.toUpperCase();

      // ── Check if the shipment fits in a Swiss Post B4 letter ──
      // B4 letter: max 35.3 × 25 × 2 cm, max 2 kg
      const B4_MAX_CM = 35.3;
      const B4_MID_CM = 25;
      const B4_THICKNESS_CM = 2;
      const B4_MAX_WEIGHT_KG = 2;
      const STICKER_THICKNESS_CM = 0.2; // ~2 mm per sticker sheet

      let fitsAsLetter = true;
      let totalLetterWeightKg = 0;
      let totalThicknessCm = 0;

      for (const item of orderItems) {
        const maxDim = Math.max(item.height || 0, item.width || 0);
        const minDim = Math.min(item.height || 0, item.width || 0);
        if (maxDim > B4_MAX_CM || minDim > B4_MID_CM) {
          fitsAsLetter = false;
          break;
        }
        totalLetterWeightKg += 0.01 * item.quantity; // ~10 g per sticker sheet
        totalThicknessCm += STICKER_THICKNESS_CM * item.quantity;
      }

      if (fitsAsLetter) {
        for (const item of partOrderItems) {
          try {
            const part = await this.partsService.findOne(item.partId);
            const dims = [
              Number(part.length) || 0,
              Number(part.width) || 0,
              Number(part.height) || 0,
            ].sort((a, b) => b - a); // [longest, middle, thickness]
            if (
              dims[0] > B4_MAX_CM ||
              dims[1] > B4_MID_CM ||
              dims[2] > B4_THICKNESS_CM
            ) {
              fitsAsLetter = false;
              break;
            }
            totalLetterWeightKg +=
              ((Number(part.weight) || 0) / 1000) * item.quantity;
            totalThicknessCm += dims[2] * item.quantity;
          } catch {
            fitsAsLetter = false;
            break;
          }
        }
      }

      // Add packaging weight for the envelope/padded bag
      totalLetterWeightKg += this.priceSettings.packagingWeightLetterKg;

      if (
        totalThicknessCm > B4_THICKNESS_CM ||
        totalLetterWeightKg > B4_MAX_WEIGHT_KG
      ) {
        fitsAsLetter = false;
      }

      if (fitsAsLetter) {
        const letterRate = await this.postService.getLetterRate({
          countryCode,
          weightKg: Math.max(totalLetterWeightKg, 0.005),
        });
        if (letterRate !== null) {
          shippingCost = letterRate;
          selectedCarrier = shipping_carrier_enum.swiss_post;
          this.logger.log(`Using Swiss Post B4 letter rate: ${letterRate} CHF`);
        } else {
          fitsAsLetter = false;
        }
      }

      if (!fitsAsLetter) {
        // ── Parcel shipping: collect parts data for carton calculation ──
        const partsData = [];
        for (const item of partOrderItems) {
          try {
            const part = await this.partsService.findOne(item.partId);
            partsData.push({
              length: part.length ? Number(part.length) * 10 : 0, // cm -> mm
              width: part.width ? Number(part.width) * 10 : 0, // cm -> mm
              height: part.height ? Number(part.height) * 10 : 0, // cm -> mm
              weight: part.weight ? Number(part.weight) / 1000 : 0, // g -> kg
              quantity: item.quantity,
            });
          } catch (error) {
            this.logger.error(
              `Error fetching part ${item.partId}: ${error.message}`,
            );
            throw new BadRequestException(
              `Unable to calculate shipping for part ${item.partId}`,
            );
          }
        }

        // Calculate carton dimensions - returns array of cartons
        const cartons = this.calculateCartonDimensions({
          stickers: orderItems.map((item) => ({
            width: item.width || 0,
            height: item.height || 0,
            quantity: item.quantity,
          })),
          parts: partsData,
        });

        // Calculate total items price for declared value
        let totalItemsValue = 0;

        // We'll calculate prices below, but for now estimate
        // This is a simplification - in production you'd want to calculate exact prices first
        for (const item of orderItems) {
          const area = (item.width * item.height) / 100; // Convert to cm²
          const itemPrice =
            area * this.priceSettings.basePriceCustomCm2 +
            this.priceSettings.additionalPriceCustom;
          totalItemsValue += itemPrice * item.quantity;
        }

        for (const item of partOrderItems) {
          const part = await this.partsService.findOne(item.partId);
          totalItemsValue += Number(part.price) * item.quantity;
        }

        // ── Fetch UPS and Swiss Post rates in parallel, pick the cheaper one ──
        let upsRate: number | null = null;
        let postRate: number | null = null;

        const cartonsInCm = cartons.map((c) => ({
          length: c.length / 10,
          width: c.width / 10,
          height: c.height / 10,
          weight: c.weight,
        }));

        // UPS rate
        try {
          if (cartons.length === 1) {
            upsRate = await this.upsService.getShippingRate({
              destinationAddress: {
                street: shippingAddress.street || 'Test Street 1',
                city: shippingAddress.city || 'Test City',
                zipCode: shippingAddress.zipCode || '8000',
                countryCode,
              },
              packageDimensions: {
                length: cartonsInCm[0].length,
                width: cartonsInCm[0].width,
                height: cartonsInCm[0].height,
              },
              weight: cartonsInCm[0].weight,
              declaredValue: Math.max(totalItemsValue, 1),
            });
          } else {
            upsRate = await this.upsService.getShippingRateForMultiplePackages({
              destinationAddress: {
                street: shippingAddress.street,
                city: shippingAddress.city,
                zipCode: shippingAddress.zipCode,
                countryCode,
              },
              packages: cartonsInCm,
              declaredValue: Math.max(totalItemsValue, 1),
            });
          }
          this.logger.log(`UPS rate: ${upsRate} CHF`);
        } catch (error) {
          this.logger.error(
            `Failed to get UPS shipping rate: ${error.message}`,
          );
        }

        // Swiss Post parcel rate
        try {
          if (cartons.length === 1) {
            postRate = await this.postService.getShippingRate({
              countryCode,
              lengthCm: cartonsInCm[0].length,
              widthCm: cartonsInCm[0].width,
              heightCm: cartonsInCm[0].height,
              weightKg: cartonsInCm[0].weight,
            });
          } else {
            postRate =
              await this.postService.getShippingRateForMultiplePackages({
                countryCode,
                packages: cartonsInCm,
              });
          }
          this.logger.log(`Swiss Post parcel rate: ${postRate} CHF`);
        } catch (error) {
          this.logger.error(
            `Failed to get Swiss Post shipping rate: ${error.message}`,
          );
        }

        // Pick the cheaper carrier; require at least one successful rate
        const availableRates = [upsRate, postRate].filter(
          (r): r is number => r !== null,
        );
        if (availableRates.length === 0) {
          throw new BadRequestException(
            'Unable to calculate international shipping cost',
          );
        }
        shippingCost = Math.min(...availableRates);
        // Track which carrier was selected based on who provided the winning rate
        if (postRate !== null && shippingCost === postRate) {
          selectedCarrier = shipping_carrier_enum.swiss_post;
        } else {
          selectedCarrier = shipping_carrier_enum.ups;
        }
        this.logger.log(
          `Selected shipping cost: ${shippingCost} CHF (UPS: ${upsRate}, Post: ${postRate}) → carrier: ${selectedCarrier}`,
        );
      }
    } else {
      // Domestic (Swiss) shipping
      // Letter: max 2 cm × 25 cm × 35 cm, max 2 kg
      let isDomesticLetter = true;
      let domesticLetterWeightKg = 0;

      // Check sticker dimensions
      for (const item of orderItems) {
        domesticLetterWeightKg += 0.01 * item.quantity;
        if (
          Math.max(item.height, item.width) > 35 ||
          Math.min(item.height, item.width) > 25
        ) {
          isDomesticLetter = false;
          break;
        }
      }

      // Check part dimensions
      if (isDomesticLetter) {
        for (const item of partOrderItems) {
          try {
            const part = await this.partsService.findOne(item.partId);

            // If any dimension or weight is 0, use parcel shipping
            if (
              !part.width ||
              Number(part.width) === 0 ||
              !part.height ||
              Number(part.height) === 0 ||
              !part.length ||
              Number(part.length) === 0 ||
              !part.weight ||
              Number(part.weight) === 0
            ) {
              isDomesticLetter = false;
              break;
            }

            // If weight is more than 2kg total, use parcel shipping
            if (Number(part.weight) * item.quantity > 2000) {
              isDomesticLetter = false;
              break;
            }

            // Sort all three dimensions so orientation doesn't matter:
            // smallest must fit as letter thickness (≤ 2 cm),
            // middle ≤ 25 cm, longest ≤ 35 cm
            const dims = [
              Number(part.length),
              Number(part.width),
              Number(part.height),
            ].sort((a, b) => b - a); // [longest, middle, smallest]
            if (dims[0] > 35 || dims[1] > 25 || dims[2] > 2) {
              isDomesticLetter = false;
              break;
            }

            domesticLetterWeightKg +=
              (Number(part.weight) / 1000) * item.quantity;
          } catch (error) {
            this.logger.error(
              `Error fetching part ${item.partId} for shipping calculation: ${error.message}`,
            );
            isDomesticLetter = false;
            break;
          }
        }
      }

      if (isDomesticLetter) {
        // Add packaging weight for the envelope/padded bag
        domesticLetterWeightKg += this.priceSettings.packagingWeightLetterKg;

        // Query Swiss Post letter rate for CH
        try {
          const letterRate = await this.postService.getLetterRate({
            countryCode: 'CH',
            weightKg: Math.max(domesticLetterWeightKg, 0.005),
          });
          shippingCost =
            letterRate !== null
              ? letterRate
              : this.priceSettings.shippingCostLetter;
          selectedCarrier = shipping_carrier_enum.swiss_post;
          this.logger.log(
            `Domestic letter rate: ${shippingCost} CHF (API: ${letterRate})`,
          );
        } catch {
          shippingCost = this.priceSettings.shippingCostLetter;
          selectedCarrier = shipping_carrier_enum.swiss_post;
        }
      } else {
        shippingCost = this.priceSettings.shippingCostBig;
        selectedCarrier = shipping_carrier_enum.swiss_post;
      }
    }

    // Calculate price of each sticker item
    for (const item of orderItems) {
      stickersPrice +=
        (this.priceSettings.basePriceCustomCm2 * item.height * item.width +
          this.priceSettings.additionalPriceCustom) *
        item.quantity;
    }

    // Calculate price of each part item with customization options
    let partsWithoutInitialPrice = 0;
    const partsWithInitialPriceDetails: Array<{
      itemTotalPrice: number;
      initialPrice: number;
      quantity: number;
      betterWithDiscount: boolean;
    }> = [];

    for (const item of partOrderItems) {
      try {
        const part = await this.partsService.findOne(item.partId);
        const itemPriceInCents = Math.round(part.price * 100);
        let adjustmentsInCents = 0;

        // Calculate price adjustments from customization options
        if (item.customizationOptions && item.customizationOptions.length > 0) {
          // Parse part's customization options schema if needed
          const partOptionsSchema =
            typeof part.customizationOptions === 'string'
              ? JSON.parse(part.customizationOptions)
              : part.customizationOptions;

          // Process each selected option
          for (const selectedOption of item.customizationOptions) {
            // Use direct price adjustments if provided by the client
            let hasDirectAdjustment = false;

            if (
              selectedOption.priceAdjustment !== undefined &&
              selectedOption.priceAdjustment !== null
            ) {
              adjustmentsInCents += Math.round(
                selectedOption.priceAdjustment * 100,
              );
              hasDirectAdjustment = true;
            }

            if (selectedOption.selectedItemPriceAdjustment !== undefined) {
              adjustmentsInCents += Math.round(
                selectedOption.selectedItemPriceAdjustment * 100,
              );
              hasDirectAdjustment = true;
            }

            if (hasDirectAdjustment) continue; // Skip schema lookup when direct values are present

            // Proceed with existing schema-based lookup
            if (
              !selectedOption.optionId ||
              selectedOption.optionId === undefined
            )
              continue;

            // Try to find option in the schema
            let optionSchema = null;
            if (isNaN(parseInt(selectedOption.optionId, 10))) {
              // If optionId isn't a number, try to find the option by name/id
              if (partOptionsSchema.options) {
                optionSchema = partOptionsSchema.options.find(
                  (option) =>
                    option.id === selectedOption.optionId ||
                    option.name === selectedOption.optionId,
                );
              }
            } else {
              // Use existing index-based lookup
              const optionIndex = parseInt(selectedOption.optionId, 10);
              if (
                partOptionsSchema.options &&
                partOptionsSchema.options[optionIndex]
              ) {
                optionSchema = partOptionsSchema.options[optionIndex];
              }
            }

            if (optionSchema) {
              // Add option's base price adjustment if any
              if (optionSchema.priceAdjustment) {
                adjustmentsInCents += Math.round(
                  optionSchema.priceAdjustment * 100,
                );
              }

              // Add item-specific price adjustment for dropdown options
              if (
                optionSchema.type === 'dropdown' &&
                selectedOption.type === 'dropdown' &&
                selectedOption.value
              ) {
                const selectedItem = optionSchema.items?.find(
                  (item) => item.id === selectedOption.value,
                );

                if (selectedItem && selectedItem.priceAdjustment) {
                  adjustmentsInCents += Math.round(
                    selectedItem.priceAdjustment * 100,
                  );
                }
              }
            }
          }
        }

        // Calculate final part price for this item (including quantity)
        const totalItemPriceInCents =
          (itemPriceInCents + adjustmentsInCents) * item.quantity;
        const itemTotalPrice = totalItemPriceInCents / 100; // Convert back to dollars/euros
        partsPrice += itemTotalPrice;

        // Separate parts with and without initialPrice for discount calculation
        if (part.initialPrice && part.initialPrice > 0) {
          const initialPriceTotalInCents =
            Math.round(part.initialPrice * 100) * item.quantity;
          const initialPriceTotal = initialPriceTotalInCents / 100;

          partsWithInitialPriceDetails.push({
            itemTotalPrice,
            initialPrice: initialPriceTotal,
            quantity: item.quantity,
            betterWithDiscount: false, // Will be calculated during discount logic
          });
        } else {
          partsWithoutInitialPrice += itemTotalPrice;
        }
      } catch (error) {
        this.logger.error(
          `Error calculating price for part ${item.partId}: ${error.message}`,
        );
        throw new NotFoundException(`Part with ID ${item.partId} not found`);
      }
    }

    // Calculate total items price - initially use normal prices for all parts
    let finalDiscountAmount = 0;

    // Calculate the discount from the discountCode using normal prices
    if (validatedDiscount) {
      if (validatedDiscount.type === 'percentage') {
        // Calculate discount amount for stickers
        const stickersDiscountAmount =
          this.discountService.calculateDiscountAmount(
            stickersPrice,
            validatedDiscount.type,
            validatedDiscount.value,
          );

        let partsDiscountAmount = 0;

        // Handle parts with initial prices using the new logic
        for (const partDetail of partsWithInitialPriceDetails) {
          // Calculate what the initial price would be with discount applied
          const initialPriceWithDiscount =
            partDetail.initialPrice * (1 - validatedDiscount.value / 100);

          // Always use the best price among: current price, initial price with discount
          if (initialPriceWithDiscount < partDetail.itemTotalPrice) {
            // Initial price with discount is better than current price
            // Track the discount amount (difference between initial price and discounted initial price)
            partsDiscountAmount +=
              partDetail.initialPrice - initialPriceWithDiscount;
          } else {
            // Current price is better than or equal to initial price with discount
            // Apply discount to current price
            const currentPriceDiscount =
              this.discountService.calculateDiscountAmount(
                partDetail.itemTotalPrice,
                validatedDiscount.type,
                validatedDiscount.value,
              );
            partsDiscountAmount += currentPriceDiscount;
          }
        }

        // Add discount for parts without initial prices
        const partsWithoutInitialPriceDiscount =
          this.discountService.calculateDiscountAmount(
            partsWithoutInitialPrice,
            validatedDiscount.type,
            validatedDiscount.value,
          );
        partsDiscountAmount += partsWithoutInitialPriceDiscount;

        finalDiscountAmount = stickersDiscountAmount + partsDiscountAmount;
        discountAmount = finalDiscountAmount;
      } else {
        // For fixed discounts, use best prices for parts (initial vs current)
        let optimizedPartsPrice = 0;

        // For parts with initial prices, use the better of current price vs initial price
        for (const partDetail of partsWithInitialPriceDetails) {
          // For fixed discounts, compare current price vs initial price without discount
          if (partDetail.initialPrice < partDetail.itemTotalPrice) {
            // Initial price is better than current price
            optimizedPartsPrice += partDetail.initialPrice;
          } else {
            // Current price is better than or equal to initial price
            optimizedPartsPrice += partDetail.itemTotalPrice;
          }
        }

        // Add parts without initial prices at normal price
        optimizedPartsPrice += partsWithoutInitialPrice;

        // Calculate fixed discount amount on the optimized total
        const optimizedTotalItemsPrice = stickersPrice + optimizedPartsPrice;

        finalDiscountAmount = this.discountService.calculateDiscountAmount(
          optimizedTotalItemsPrice,
          validatedDiscount.type,
          validatedDiscount.value,
        );
        discountAmount = finalDiscountAmount;
      }
    } else {
      // No discount code applied - use normal prices for all parts
      discountAmount = 0;
    }

    // Calculate final price using original prices, then subtract discount
    const finalTotalItemsPrice = stickersPrice + partsPrice;

    // Subtract the discount amount from total items price
    const discountedItemsPrice = finalTotalItemsPrice - discountAmount;

    // Apply free shipping if discount code is free_shipping type
    // Free shipping discount works for both domestic and international orders
    if (validatedDiscount && validatedDiscount.type === 'free_shipping') {
      shippingCost = 0;
    }
    // Check if order is eligible for free shipping based on discounted price
    // Free shipping only applies to domestic (Swiss) orders
    else if (
      !isInternational &&
      discountedItemsPrice >= this.priceSettings.freeShippingThreshold
    ) {
      shippingCost = 0;
    }

    const totalPrice = discountedItemsPrice + shippingCost;

    const result = {
      totalPrice,
      shipmentCost: shippingCost,
      selectedCarrier,
      stickersPrice,
      partsPrice,
      codeDiscount: discountAmount,
      discountCode: discountCode,
      freeShippingThreshold: this.priceSettings.freeShippingThreshold,
    };

    return result;
  }

  /**
   * Calculate the price for a single sticker (standard or custom) or part
   */
  async calculateSinglePrice(params: {
    stickerId?: string;
    partId?: string;
    width?: number;
    height?: number;
    vinyl?: boolean;
    printed?: boolean;
    quantity?: number;
    customizationOptions?: any[];
  }): Promise<{
    price: number;
    basePrice?: number;
    adjustments?: number;
  }> {
    const {
      stickerId,
      partId,
      width,
      height,
      quantity = 1,
      customizationOptions = [],
    } = params;
    let priceInCents = 0;
    let basePriceInCents = 0;
    let adjustmentsInCents = 0;

    // Calculate price based on item type
    if (stickerId) {
      // Validate sticker input
      if (!width || !height || width <= 0 || height <= 0) {
        throw new BadRequestException(
          'Width and height must be positive numbers for stickers',
        );
      }

      priceInCents = Math.round(
        (this.priceSettings.basePriceCustomCm2 * width * height +
          this.priceSettings.additionalPriceCustom) *
          100 *
          quantity,
      );
    } else if (partId) {
      // Part with ID
      try {
        const part = await this.partsService.findOne(partId);
        basePriceInCents = Math.round(part.price * 100);

        // Calculate price adjustments from customization options
        if (customizationOptions && customizationOptions.length > 0) {
          // Parse part's customization options schema if needed
          const partOptionsSchema =
            typeof part.customizationOptions === 'string'
              ? JSON.parse(part.customizationOptions)
              : part.customizationOptions;

          // Process each selected option
          for (const selectedOption of customizationOptions) {
            // Use direct price adjustments if provided by the client
            let hasDirectAdjustment = false;

            if (
              selectedOption.priceAdjustment !== undefined &&
              selectedOption.priceAdjustment !== null
            ) {
              adjustmentsInCents += Math.round(
                selectedOption.priceAdjustment * 100,
              );
              hasDirectAdjustment = true;
            }

            if (selectedOption.selectedItemPriceAdjustment !== undefined) {
              adjustmentsInCents += Math.round(
                selectedOption.selectedItemPriceAdjustment * 100,
              );
              hasDirectAdjustment = true;
            }

            if (hasDirectAdjustment) continue; // Skip schema lookup when direct values are present

            if (
              !selectedOption.optionId ||
              selectedOption.optionId === undefined
            )
              continue;

            // Find the corresponding option schema
            const optionIndex = parseInt(selectedOption.optionId, 10);
            if (
              partOptionsSchema.options &&
              partOptionsSchema.options[optionIndex]
            ) {
              const optionSchema = partOptionsSchema.options[optionIndex];

              // Add option's base price adjustment if any
              if (optionSchema.priceAdjustment) {
                adjustmentsInCents += Math.round(
                  optionSchema.priceAdjustment * 100,
                );
              }

              // Add item-specific price adjustment for dropdown options
              if (
                optionSchema.type === 'dropdown' &&
                selectedOption.type === 'dropdown' &&
                selectedOption.value
              ) {
                const selectedItem = optionSchema.items.find(
                  (item) => item.id === selectedOption.value,
                );

                if (selectedItem && selectedItem.priceAdjustment) {
                  adjustmentsInCents += Math.round(
                    selectedItem.priceAdjustment * 100,
                  );
                }
              }
            }
          }
        }

        // Calculate final price
        priceInCents = (basePriceInCents + adjustmentsInCents) * quantity;
      } catch {
        throw new NotFoundException(`Part with ID ${partId} not found`);
      }
    } else if (width && height) {
      // Custom sticker without ID
      priceInCents = Math.round(
        (this.priceSettings.basePriceCustomCm2 * width * height +
          this.priceSettings.additionalPriceCustom) *
          100 *
          quantity,
      );
    } else {
      throw new BadRequestException('Invalid parameters for price calculation');
    }

    // Convert back from cents to dollars/euros
    return {
      price: priceInCents / 100,
      basePrice: basePriceInCents > 0 ? basePriceInCents / 100 : undefined,
      adjustments:
        adjustmentsInCents > 0 ? adjustmentsInCents / 100 : undefined,
    };
  }

  /**
   * Send shipping notification email when order is completed
   */
  private async sendShippingNotificationEmail(order: any) {
    const customerEmail = order.email || order.guestEmail;
    if (!customerEmail) {
      this.logger.warn(
        `No email address available for shipping notification: ${order.id}`,
      );
      return;
    }

    await this.mailService.sendShippingNotificationEmail({
      email: customerEmail,
      firstName: order.firstName,
      lastName: order.lastName,
      orderId: order.id,
      totalPrice: order.totalPrice.toNumber(),
      orderItems: order.items.map((item) => ({
        quantity: item.quantity,
        width: item.width?.toNumber(),
        height: item.height?.toNumber(),
        vinyl: item.vinyl,
        printed: item.printed,
        stickerId: item.stickerId,
        stickerName:
          item.sticker?.translations?.find((t) => t.language === 'de')?.title ||
          item.sticker?.translations?.[0]?.title ||
          undefined,
        stickerImages: item.sticker?.images || [],
        customizationOptions:
          typeof item.customizationOptions === 'string'
            ? JSON.parse(item.customizationOptions)
            : item.customizationOptions,
      })),
      partOrderItems: order.partItems.map((item) => ({
        quantity: item.quantity,
        partId: item.partId,
        partName:
          item.part?.translations?.find((t) => t.language === 'de')?.title ||
          item.part?.translations?.[0]?.title ||
          `Teil ${item.partId}`,
        partImages: item.part?.images || [],
        customizationOptions:
          typeof item.customizationOptions === 'string'
            ? JSON.parse(item.customizationOptions)
            : item.customizationOptions,
      })),
    });

    this.logger.log(
      `Shipping notification email sent to: ${customerEmail} for order ${order.id}`,
    );
  }

  /**
   * Calculate the best fitting carton(s) for given items
   * Returns an array of cartons if items don't fit in one box
   */
  private calculateCartonDimensions(items: {
    stickers: Array<{ width: number; height: number; quantity: number }>;
    parts: Array<{
      length?: number;
      width?: number;
      height?: number;
      weight?: number;
      quantity: number;
    }>;
  }): Array<{ length: number; width: number; height: number; weight: number }> {
    // Start with minimum dimensions
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;
    let totalWeight = 0;

    // Process stickers (each sticker is 50x50x5mm, 0.01kg)
    for (const sticker of items.stickers) {
      const stickerLength = 50; // mm
      const stickerWidth = 50; // mm
      const stickerHeight = 5; // mm
      const stickerWeight = 0.01; // kg

      maxLength = Math.max(maxLength, stickerLength);
      maxWidth = Math.max(maxWidth, stickerWidth);
      totalHeight += stickerHeight * sticker.quantity;
      totalWeight += stickerWeight * sticker.quantity;
    }

    // Process parts
    for (const part of items.parts) {
      const partLength = part.length || 0;
      const partWidth = part.width || 0;
      const partHeight = part.height || 0;
      const partWeight = part.weight || 0;

      maxLength = Math.max(maxLength, partLength);
      maxWidth = Math.max(maxWidth, partWidth);
      totalHeight += partHeight * part.quantity;
      totalWeight += partWeight * part.quantity;
    }

    // Add carton + padding weight before selecting the box
    totalWeight += this.priceSettings.packagingWeightParcelKg;

    // Find the smallest carton that fits
    for (const carton of this.cartonSizes) {
      // Check if items fit in this carton (considering all orientations)
      const dimensions = [maxLength, maxWidth, totalHeight].sort(
        (a, b) => b - a,
      );
      const cartonDimensions = [
        carton.length,
        carton.width,
        carton.height,
      ].sort((a, b) => b - a);

      if (
        dimensions[0] <= cartonDimensions[0] &&
        dimensions[1] <= cartonDimensions[1] &&
        dimensions[2] <= cartonDimensions[2]
      ) {
        // Items fit in this carton
        return [
          {
            length: carton.length,
            width: carton.width,
            height: carton.height,
            weight: Math.max(totalWeight, 0.1), // Minimum 0.1kg
          },
        ];
      }
    }

    // Items don't fit in one carton - calculate how many boxes are needed
    const largestCarton = this.cartonSizes[this.cartonSizes.length - 1];
    const largestCartonDimensions = [
      largestCarton.length,
      largestCarton.width,
      largestCarton.height,
    ].sort((a, b) => b - a);

    // Calculate how many boxes we need based on the stackable height
    const stackableHeight = largestCartonDimensions[2]; // Smallest dimension of largest box
    const boxesNeeded = Math.ceil(totalHeight / stackableHeight);

    this.logger.log(
      `Items require ${boxesNeeded} boxes. Total dimensions: ${maxLength}x${maxWidth}x${totalHeight}mm, Weight: ${totalWeight}kg`,
    );

    // Distribute weight evenly across boxes
    const weightPerBox = totalWeight / boxesNeeded;

    // Create array of boxes
    const cartons = [];
    for (let i = 0; i < boxesNeeded; i++) {
      cartons.push({
        length: largestCarton.length,
        width: largestCarton.width,
        height: largestCarton.height,
        weight: Math.max(weightPerBox, 0.1), // Minimum 0.1kg per box
      });
    }

    return cartons;
  }
}
