import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  /**
   * Get user's cart with all items, including full customization options with translations
   * Supports both authenticated users (userId) and anonymous users (anonymousToken)
   */
  async getCart(userId?: string, anonymousToken?: string) {
    // Find or create a cart for the user or anonymous token
    const cart = await this.findOrCreateCart(userId, anonymousToken);

    // Fetch cart with all items and their full details including customization options
    const cartData = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        orderItems: {
          include: {
            sticker: {
              include: {
                translations: true,
              },
            },
            customSticker: true,
          },
        },
        partOrderItems: {
          include: {
            part: {
              include: {
                translations: true,
                groups: {
                  include: {
                    translations: true,
                  },
                },
                links: {
                  include: {
                    translations: true,
                  },
                },
                accessories: {
                  include: {
                    translations: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Process partOrderItems to replace color IDs with full color objects
    if (cartData?.partOrderItems) {
      for (const item of cartData.partOrderItems) {
        if (
          item.customizationOptions &&
          Array.isArray(item.customizationOptions)
        ) {
          for (const option of item.customizationOptions as any[]) {
            // If this is a filamentColor option and value is a UUID
            if (
              option.type === 'filamentColor' &&
              typeof option.value === 'string'
            ) {
              try {
                const color = await this.prisma.available_color.findUnique({
                  where: { id: option.value },
                });
                if (color) {
                  option.colorDetails = color;
                }
              } catch (error) {
                this.logger.warn(
                  `Could not fetch color with ID ${option.value}:`,
                  error,
                );
              }
            }
          }
        }
      }
    }

    return cartData;
  }

  /**
   * Add a sticker to the cart (supports both authenticated and anonymous users)
   */
  async addStickerToCart(
    data: {
      stickerId?: string;
      customStickerId?: string;
      width: number;
      height: number;
      vinyl: boolean;
      printed: boolean;
      quantity: number;
      customizationOptions?: any[];
    },
    userId?: string,
    anonymousToken?: string,
  ) {
    // Find or create cart
    const cart = await this.findOrCreateCart(userId, anonymousToken);

    // Create the order item
    const orderItemData: any = {
      width: data.width,
      height: data.height,
      vinyl: data.vinyl,
      printed: data.printed,
      quantity: data.quantity,
      customizationOptions: data.customizationOptions || [],
      order: {
        create: {
          paymentMethod: 'stripe',
          totalPrice: 0,
          status: 'cart_temp',
        },
      },
    };

    // Use proper relation syntax to connect sticker or customSticker
    if (data.stickerId) {
      orderItemData.sticker = {
        connect: { id: data.stickerId },
      };
    } else if (data.customStickerId) {
      orderItemData.customSticker = {
        connect: { id: data.customStickerId },
      };
    }

    const orderItem = await this.prisma.order_item.create({
      data: orderItemData,
    });

    // Connect the order item to the cart
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        orderItems: {
          connect: { id: orderItem.id },
        },
      },
    });

    return this.getCart(userId, anonymousToken);
  }

  /**
   * Add a part to the cart with full customization options including translations
   * Supports both authenticated and anonymous users
   */
  async addPartToCart(
    data: {
      partId: string;
      quantity: number;
      customizationOptions?: any;
    },
    userId?: string,
    anonymousToken?: string,
  ) {
    // Find or create cart
    const cart = await this.findOrCreateCart(userId, anonymousToken);

    this.logger.log(JSON.stringify(data));

    // Fetch the part with full customization options including translations
    const part = await this.prisma.part.findUnique({
      where: { id: data.partId },
      include: {
        translations: true,
      },
    });

    if (!part) {
      throw new NotFoundException(`Part with ID ${data.partId} not found`);
    }

    // Parse customizationOptions from the part if it's a string
    let partCustomizationOptions = part.customizationOptions;
    if (typeof partCustomizationOptions === 'string') {
      try {
        partCustomizationOptions = JSON.parse(partCustomizationOptions);
      } catch (error) {
        this.logger.error('Error parsing part customizationOptions:', error);
        partCustomizationOptions = {};
      }
    }

    // Merge the part's full customization options (with translations) with user selections
    // The user's customizationOptions contains their selections
    // We need to preserve the full structure including translations from the part
    const mergedCustomizationOptions =
      data.customizationOptions || partCustomizationOptions;

    // Create the part order item
    const partOrderItem = await this.prisma.part_order_item.create({
      data: {
        part: {
          connect: { id: data.partId },
        },
        quantity: data.quantity,
        // Store the full customizationOptions including translations
        customizationOptions: mergedCustomizationOptions,
        // Create a temporary order for this item
        order: {
          create: {
            paymentMethod: 'stripe', // Default value, will be updated when checking out
            totalPrice: 0, // Will be calculated when checking out
            status: 'cart_temp', // Temporary status for cart items
          },
        },
      },
    });

    // Connect the part order item to the cart
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        partOrderItems: {
          connect: { id: partOrderItem.id },
        },
      },
    });

    return this.getCart(userId, anonymousToken);
  }

  /**
   * Remove a sticker item from the cart
   */
  async removeStickerFromCart(
    orderItemId: string,
    userId?: string,
    anonymousToken?: string,
  ) {
    const cart = await this.findOrCreateCart(userId, anonymousToken);

    // Check if the item exists in the cart
    const cartWithItem = await this.prisma.cart.findFirst({
      where: {
        id: cart.id,
        orderItems: {
          some: {
            id: orderItemId,
          },
        },
      },
    });

    if (!cartWithItem) {
      throw new NotFoundException('Item not found in the cart');
    }

    // Disconnect the order item from the cart
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        orderItems: {
          disconnect: { id: orderItemId },
        },
      },
    });

    // Delete the orphaned order item
    await this.prisma.order_item.delete({
      where: { id: orderItemId },
    });

    return this.getCart(userId, anonymousToken);
  }

  async updateStickerAmount(
    orderItemId: string,
    amount: number,
    userId?: string,
    anonymousToken?: string,
  ) {
    const cart = await this.findOrCreateCart(userId, anonymousToken);

    // Check if the item exists in the cart
    const cartWithItem = await this.prisma.cart.findFirst({
      where: {
        id: cart.id,
        orderItems: {
          some: {
            id: orderItemId,
          },
        },
      },
    });

    if (!cartWithItem) {
      throw new NotFoundException('Item not found in the cart');
    }

    // Update the quantity of the order item
    await this.prisma.order_item.update({
      where: { id: orderItemId },
      data: { quantity: amount },
    });

    return this.getCart(userId, anonymousToken);
  }

  async updatePartAmount(
    partOrderItemId: string,
    amount: number,
    userId?: string,
    anonymousToken?: string,
  ) {
    const cart = await this.findOrCreateCart(userId, anonymousToken);
    // Check if the item exists in the cart
    const cartWithItem = await this.prisma.cart.findFirst({
      where: {
        id: cart.id,
        partOrderItems: {
          some: {
            id: partOrderItemId,
          },
        },
      },
    });
    if (!cartWithItem) {
      throw new NotFoundException('Part item not found in the cart');
    }
    // Update the quantity of the part order item
    await this.prisma.part_order_item.update({
      where: { id: partOrderItemId },
      data: { quantity: amount },
    });
    return this.getCart(userId, anonymousToken);
  }

  /**
   * Remove a part item from the cart
   */
  async removePartFromCart(
    partOrderItemId: string,
    userId?: string,
    anonymousToken?: string,
  ) {
    const cart = await this.findOrCreateCart(userId, anonymousToken);

    // Check if the item exists in the cart
    const cartWithItem = await this.prisma.cart.findFirst({
      where: {
        id: cart.id,
        partOrderItems: {
          some: {
            id: partOrderItemId,
          },
        },
      },
    });

    if (!cartWithItem) {
      throw new NotFoundException('Part item not found in the cart');
    }

    // Disconnect the part order item from the cart
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        partOrderItems: {
          disconnect: { id: partOrderItemId },
        },
      },
    });

    // Delete the orphaned part order item
    await this.prisma.part_order_item.delete({
      where: { id: partOrderItemId },
    });

    return this.getCart(userId, anonymousToken);
  }

  /**
   * Find or create a cart for the user or anonymous token
   * Supports both authenticated users (userId) and anonymous users (anonymousToken)
   * Anonymous carts expire after 72 hours
   * @private
   */
  private async findOrCreateCart(userId?: string, anonymousToken?: string) {
    if (!userId && !anonymousToken) {
      throw new UnauthorizedException(
        'Either userId or anonymousToken is required to access cart',
      );
    }

    let cart = null;

    // Try to find cart by userId first (authenticated user)
    if (userId) {
      cart = await this.prisma.cart.findFirst({
        where: { userId },
      });

      if (!cart) {
        // Create new cart for authenticated user
        cart = await this.prisma.cart.create({
          data: {
            user: {
              connect: { id: userId },
            },
          },
        });
      }
    }
    // If no userId, try to find cart by anonymousToken
    else if (anonymousToken) {
      cart = await this.prisma.cart.findFirst({
        where: {
          anonymousToken,
          // Only return non-expired carts
          OR: [
            { anonymousExpiresAt: null },
            { anonymousExpiresAt: { gt: new Date() } },
          ],
        },
      });

      if (!cart) {
        // Create new cart for anonymous user with 72-hour expiry
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72);

        cart = await this.prisma.cart.create({
          data: {
            anonymousToken,
            anonymousExpiresAt: expiresAt,
          },
        });
      }
    }

    return cart;
  }

  /**
   * Clear the entire cart
   */
  async clearCart(userId?: string, anonymousToken?: string) {
    this.logger.log(
      `Clearing cart for userId: ${userId}, anonymousToken: ${anonymousToken}`,
    );
    const cart = await this.findOrCreateCart(userId, anonymousToken);

    // Get all items in the cart
    const cartWithItems = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        orderItems: true,
        partOrderItems: true,
      },
    });

    // Disconnect all items from the cart
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        orderItems: {
          disconnect: cartWithItems.orderItems.map((item) => ({ id: item.id })),
        },
        partOrderItems: {
          disconnect: cartWithItems.partOrderItems.map((item) => ({
            id: item.id,
          })),
        },
      },
    });

    // Delete all disconnected items
    for (const item of cartWithItems.orderItems) {
      await this.prisma.order_item.delete({
        where: { id: item.id },
      });
    }

    for (const item of cartWithItems.partOrderItems) {
      await this.prisma.part_order_item.delete({
        where: { id: item.id },
      });
    }

    return { message: 'Cart cleared successfully' };
  }

  /**
   * Delete the entire cart
   */
  async deleteWholeCart(userId?: string, anonymousToken?: string) {
    const cart = await this.findOrCreateCart(userId, anonymousToken);

    // Delete the cart and all its items
    await this.prisma.cart.delete({
      where: { id: cart.id },
    });

    return { message: 'Cart deleted successfully' };
  }

  /**
   * Helper method to convert text to URL-friendly slug
   */
  private toSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace special characters and spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Helper method to get the name of an item based on its type
   */
  private getItemName(item: any, type: 'part' | 'sticker'): string {
    // For parts and stickers, try to get English translation first, then fallback to any translation
    if (item.translations && item.translations.length > 0) {
      const enTranslation = item.translations.find(
        (t: any) => t.language === 'en',
      );
      if (enTranslation) {
        return enTranslation.title;
      }
      // Fallback to first available translation
      return item.translations[0].title;
    }

    return type === 'part' ? 'Part' : 'Sticker';
  }

  /**
   * Helper method to extract image name(s) from an item
   */
  private getItemImages(item: any): string | string[] | null {
    // Handle array of images
    if (item.images && Array.isArray(item.images)) {
      return item.images.length > 0 ? item.images : null;
    }

    // Handle single image field
    if (item.image) {
      return item.image;
    }

    // Handle imageName field (some entities might use this)
    if (item.imageName) {
      return item.imageName;
    }

    return null;
  }

  /**
   * Get recommendations to reach at least 100 CHF from the current cost amount
   * Returns items (parts or stickers) that when added to costAmount
   * will reach at least 100 CHF. Excludes items already in cart.
   */
  async getRecommendations(costAmount: number, itemsIdInCart: string[]) {
    const targetAmount = 100;
    const neededAmount = targetAmount - costAmount;

    // If already at or above 100 CHF, return empty
    if (neededAmount <= 0) {
      return {
        message: 'Already at or above 100 CHF',
        recommendations: [],
      };
    }

    // Fetch all active items from the database
    const [parts, stickers] = await Promise.all([
      this.prisma.part.findMany({
        where: {
          active: true,
          id: { notIn: itemsIdInCart },
        },
        include: {
          translations: true,
        },
      }),
      this.prisma.sticker.findMany({
        where: {
          active: true,
          id: { notIn: itemsIdInCart },
        },
        include: {
          translations: true,
        },
      }),
    ]);

    // Prepare all items with their prices
    const allItems: Array<{
      id: string;
      type: 'part' | 'sticker';
      price: number;
      data: any;
    }> = [];

    // Add parts
    parts.forEach((part) => {
      allItems.push({
        id: part.id,
        type: 'part',
        price: Number(part.price),
        data: part,
      });
    });

    // Add stickers - use generalPrice if available, otherwise use a base price calculation
    stickers.forEach((sticker) => {
      let price = 0;
      if (sticker.generalPrice) {
        price = Number(sticker.generalPrice);
      } else if (sticker.price) {
        price = Number(sticker.price);
      }

      // Only include stickers with a valid price
      if (price > 0) {
        allItems.push({
          id: sticker.id,
          type: 'sticker',
          price: price,
          data: sticker,
        });
      }
    });

    // Sort items by how close they get to the needed amount without going under
    // Priority: items that get us to exactly 100 or just above
    const sortedItems = allItems
      .map((item) => ({
        ...item,
        totalWithItem: costAmount + item.price,
        difference: costAmount + item.price - targetAmount,
      }))
      .filter((item) => item.totalWithItem >= targetAmount) // Only items that reach the target
      .sort((a, b) => a.difference - b.difference); // Sort by smallest difference

    // If we found a single item that gets us to 100+, return it
    if (sortedItems.length > 0) {
      const bestItem = sortedItems[0];
      const name = this.getItemName(bestItem.data, bestItem.type);
      const images = this.getItemImages(bestItem.data);
      return {
        neededAmount,
        targetAmount,
        currentAmount: costAmount,
        recommendations: [
          {
            id: bestItem.id,
            type: bestItem.type,
            name: name,
            slug: this.toSlug(name),
            price: bestItem.price,
            images: images,
            totalWithItem: bestItem.totalWithItem,
            data: bestItem.data,
          },
        ],
      };
    }

    // If no single item reaches 100, find combinations of 2 items
    const combinations: Array<{
      items: typeof allItems;
      total: number;
      difference: number;
    }> = [];

    for (let i = 0; i < allItems.length; i++) {
      for (let j = i + 1; j < allItems.length; j++) {
        const total = costAmount + allItems[i].price + allItems[j].price;
        if (total >= targetAmount) {
          combinations.push({
            items: [allItems[i], allItems[j]],
            total,
            difference: total - targetAmount,
          });
        }
      }
    }

    // Sort combinations by smallest difference
    combinations.sort((a, b) => a.difference - b.difference);

    if (combinations.length > 0) {
      const bestCombination = combinations[0];
      return {
        neededAmount,
        targetAmount,
        currentAmount: costAmount,
        recommendations: bestCombination.items.map((item) => {
          const name = this.getItemName(item.data, item.type);
          const images = this.getItemImages(item.data);
          return {
            id: item.id,
            type: item.type,
            name: name,
            slug: this.toSlug(name),
            price: item.price,
            images: images,
            data: item.data,
          };
        }),
        totalWithItems: bestCombination.total,
      };
    }

    // If no combination of 2 items works, try 3 items
    const trioCombinations: Array<{
      items: typeof allItems;
      total: number;
      difference: number;
    }> = [];

    for (let i = 0; i < allItems.length; i++) {
      for (let j = i + 1; j < allItems.length; j++) {
        for (let k = j + 1; k < allItems.length; k++) {
          const total =
            costAmount +
            allItems[i].price +
            allItems[j].price +
            allItems[k].price;
          if (total >= targetAmount) {
            trioCombinations.push({
              items: [allItems[i], allItems[j], allItems[k]],
              total,
              difference: total - targetAmount,
            });
          }
        }
      }
    }

    trioCombinations.sort((a, b) => a.difference - b.difference);

    if (trioCombinations.length > 0) {
      const bestTrio = trioCombinations[0];
      return {
        neededAmount,
        targetAmount,
        currentAmount: costAmount,
        recommendations: bestTrio.items.map((item) => {
          const name = this.getItemName(item.data, item.type);
          const images = this.getItemImages(item.data);
          return {
            id: item.id,
            type: item.type,
            name: name,
            slug: this.toSlug(name),
            price: item.price,
            images: images,
            data: item.data,
          };
        }),
        totalWithItems: bestTrio.total,
      };
    }

    // If still no combination found
    return {
      neededAmount,
      targetAmount,
      currentAmount: costAmount,
      message: 'No suitable items found to reach 100 CHF',
      recommendations: [],
    };
  }

  /**
   * Cleanup expired anonymous carts
   * This should be called periodically (e.g., by a scheduler)
   */
  async cleanupExpiredAnonymousCarts() {
    const now = new Date();

    // Find all expired anonymous carts
    const expiredCarts = await this.prisma.cart.findMany({
      where: {
        anonymousToken: { not: null },
        anonymousExpiresAt: { lte: now },
      },
      include: {
        orderItems: true,
        partOrderItems: true,
      },
    });

    this.logger.log(
      `Found ${expiredCarts.length} expired anonymous carts to cleanup`,
    );

    // Delete each expired cart and its items
    for (const cart of expiredCarts) {
      try {
        // Delete all order items
        for (const item of cart.orderItems) {
          await this.prisma.order_item.delete({ where: { id: item.id } });
        }

        // Delete all part order items
        for (const item of cart.partOrderItems) {
          await this.prisma.part_order_item.delete({ where: { id: item.id } });
        }

        // Delete the cart itself
        await this.prisma.cart.delete({ where: { id: cart.id } });

        this.logger.log(
          `Deleted expired cart ${cart.id} with token ${cart.anonymousToken}`,
        );
      } catch (error) {
        this.logger.error(`Error deleting expired cart ${cart.id}:`, error);
      }
    }

    return {
      message: `Cleaned up ${expiredCarts.length} expired anonymous carts`,
      count: expiredCarts.length,
    };
  }
}
