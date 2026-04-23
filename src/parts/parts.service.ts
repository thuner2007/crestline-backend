import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePartDto, UpdatePartDto } from './dto/part.dto';
import { part } from '@prisma/client';

@Injectable()
export class PartsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPartDto: CreatePartDto): Promise<any> {
    const {
      groups,
      translations,
      customizationOptions,
      shippingReady,
      shippingDate,
      type,
      links,
      videos,
      filamentTypeIds,
      ...createData
    } = createPartDto;

    try {
      // Create the part with Prisma
      return await this.prisma.part.create({
        data: {
          ...createData,
          ...(type !== undefined ? { type } : {}),
          // Set shipping ready status if provided
          ...(shippingReady && { shippingReady }),
          // Set shipping date if provided
          ...(shippingDate && { shippingDate: new Date(shippingDate) }),
          // Convert customizationOptions to JSON if present
          ...(customizationOptions && {
            customizationOptions:
              typeof customizationOptions === 'object'
                ? JSON.stringify(customizationOptions)
                : customizationOptions,
          }),

          // Connect groups if provided
          ...(groups && {
            groups: { connect: groups.map((groupId) => ({ id: groupId })) },
          }),

          // Connect filament types if provided
          ...(filamentTypeIds && {
            filamentTypes: {
              connect: filamentTypeIds.map((id) => ({ id })),
            },
          }),

          // Create translations if provided
          ...(translations && {
            translations: {
              create: Object.entries(translations).map(
                ([language, content]) => ({
                  language,
                  title: content.title,
                  description: content.description || null,
                }),
              ),
            },
          }),

          // Create links if provided
          ...(links &&
            links.length > 0 && {
              links: {
                create: links.map((link) => ({
                  translations: {
                    create: Object.entries(link.translations).map(
                      ([language, content]) => ({
                        language,
                        title: content.title,
                        url: content.url,
                      }),
                    ),
                  },
                })),
              },
            }),

          // Add videos if provided
          ...(videos && { videos }),
        },
        include: {
          groups: true,
          sections: { include: { translations: true } },
          translations: true,
          links: { include: { translations: true } },
          filamentTypes: {
            include: {
              colors: { where: { active: true } },
            },
          },
        },
      });
    } catch (error) {
      if ((error as any).code === 'P2002') {
        throw new BadRequestException('Part with this title already exists');
      }
      if ((error as any).code === 'P2003') {
        throw new BadRequestException('Invalid reference ID provided');
      }
      throw error;
    }
  }

  async findOne(id: string, includeStock: boolean = true): Promise<any> {
    if (includeStock) {
      return this.getPartWithStockInfo(id);
    }

    const part = await this.prisma.part.findUnique({
      where: { id },
      include: {
        groups: true,
        sections: { include: { translations: true } },
        translations: true,
        links: { include: { translations: true } },
        accessories: { include: { translations: true } },
        filamentTypes: {
          include: {
            colors: { where: { active: true } },
          },
        },
      },
    });

    if (!part) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }

    // Parse customizationOptions if it's a string
    if (typeof part.customizationOptions === 'string') {
      try {
        part.customizationOptions = JSON.parse(part.customizationOptions);
      } catch (error) {
        console.error('Error parsing customizationOptions:', error);
        // Don't modify if parsing fails
      }
    }

    // Enhance customizationOptions with filament colors if needed
    part.customizationOptions = await this.enhanceFilamentColorOptions(
      part.customizationOptions,
    );

    return part;
  }

  // Helper method to convert name to URL-friendly slug
  private nameToSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace special characters and spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  // Helper method to populate filamentColor options with actual colors
  private async enhanceFilamentColorOptions(
    customizationOptions: any,
  ): Promise<any> {
    if (
      !customizationOptions ||
      typeof customizationOptions !== 'object' ||
      !('options' in customizationOptions) ||
      !Array.isArray(customizationOptions.options)
    ) {
      return customizationOptions;
    }

    const enhancedOptions = await Promise.all(
      customizationOptions.options.map(async (option: any) => {
        if (option.type === 'filamentColor' && option.filamentTypeId) {
          // Fetch the filament type with its colors
          const filamentType = await this.prisma.filament_type.findUnique({
            where: { id: option.filamentTypeId },
            include: {
              colors: { where: { active: true } },
            },
          });

          if (filamentType && filamentType.colors.length > 0) {
            // Convert colors to dropdown-like items
            const colorItems = filamentType.colors.map((color) => ({
              id: color.id,
              value: color.color,
              priceAdjustment: 0, // Colors typically don't have price adjustments
            }));

            // Return the option with populated colors
            return {
              ...option,
              colors: colorItems,
              filamentTypeName: filamentType.name,
            };
          }
        }
        return option;
      }),
    );

    return {
      ...customizationOptions,
      options: enhancedOptions,
    };
  }

  async findOneByName(
    name: string,
    includeStock: boolean = true,
  ): Promise<any> {
    // Convert the input name to a slug for comparison
    const searchSlug = this.nameToSlug(name);

    // Get all parts and find the one with matching slug in any translation
    const parts = await this.prisma.part.findMany({
      include: {
        groups: true,
        translations: true,
        links: { include: { translations: true } },
        accessories: { include: { translations: true } },
        filamentTypes: {
          include: {
            colors: { where: { active: true } },
          },
        },
      },
    });

    // Find part where any translation's slugified title matches
    const part = parts.find((p) =>
      p.translations.some((t) => this.nameToSlug(t.title) === searchSlug),
    );

    if (!part) {
      throw new NotFoundException(`Part with name "${name}" not found`);
    }

    // Parse customizationOptions if it's a string
    if (typeof part.customizationOptions === 'string') {
      try {
        part.customizationOptions = JSON.parse(part.customizationOptions);
      } catch (error) {
        console.error('Error parsing customizationOptions:', error);
      }
    }

    // Enhance customizationOptions with filament colors if needed
    part.customizationOptions = await this.enhanceFilamentColorOptions(
      part.customizationOptions,
    );

    // If stock info is needed, fetch it separately
    if (includeStock) {
      return this.getPartWithStockInfo(part.id);
    }

    return part;
  }

  async findOneWithStock(id: string): Promise<any> {
    return this.getPartWithStockInfo(id);
  }

  async toggleActive(id: string): Promise<any> {
    const part = await this.findOne(id, false);
    return this.prisma.part.update({
      where: { id },
      data: { active: !part.active },
      include: {
        groups: true,
        translations: true,
        accessories: { include: { translations: true } },
        filamentTypes: {
          include: {
            colors: { where: { active: true } },
          },
        },
      },
    });
  }

  async updateShippingReady(id: string, shippingReady: any): Promise<any> {
    const part = await this.findOne(id, false); // Check if part exists
    if (!part) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }
    return this.prisma.part.update({
      where: { id },
      data: { shippingReady: shippingReady as any },
      include: {
        groups: true,
        translations: true,
        accessories: { include: { translations: true } },
      },
    });
  }

  async updateShippingDate(
    id: string,
    shippingDate: string | null,
  ): Promise<any> {
    const part = await this.findOne(id, false); // Check if part exists
    if (!part) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }
    return this.prisma.part.update({
      where: { id },
      data: { shippingDate: shippingDate ? new Date(shippingDate) : null },
      include: {
        groups: true,
        translations: true,
        accessories: { include: { translations: true } },
      },
    });
  }

  async incrementSold(id: string, amount: number): Promise<any> {
    return this.prisma.part.update({
      where: { id },
      data: { sold: { increment: amount } },
    });
  }

  async decrementQuantity(id: string, amount: number): Promise<any> {
    // First check if part exists and has enough quantity
    const part = await this.findOne(id, false);

    if (!part) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }

    if (part.quantity < amount) {
      throw new BadRequestException(
        `Insufficient stock for part ${id}. Available: ${part.quantity}, Requested: ${amount}`,
      );
    }

    // Decrement the quantity
    return this.prisma.part.update({
      where: { id },
      data: {
        quantity: {
          decrement: amount,
        },
      },
    });
  }

  async findAll(options: {
    status?: 'active' | 'inactive' | 'all';
    limit?: number;
    skip?: number;
    groupIds?: string[];
    sectionId?: string;
    random?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      status = 'active',
      limit = 20,
      skip = 0,
      groupIds,
      sectionId,
      random = false,
      sortBy = 'sortingRank',
      sortOrder = 'asc',
    } = options;

    // Build the where condition
    const where: any = {};

    // Apply status filter
    if (status !== 'all') {
      where.active = status === 'active';
    }

    // Apply group filter if groupIds are provided
    if (groupIds && groupIds.length > 0) {
      where.groups = { some: { id: { in: groupIds } } };
    }

    // Apply section filter if sectionId is provided
    if (sectionId) {
      where.sections = { some: { id: sectionId } };
    }

    // Get total count for pagination
    const total = await this.prisma.part.count({ where });

    // Build the query options
    const queryOptions: any = {
      where,
      include: {
        translations: true,
        groups: { include: { translations: true } },
        sections: { include: { translations: true } },
        links: { include: { translations: true } },
        accessories: { include: { translations: true } },
        filamentTypes: {
          include: {
            colors: { where: { active: true } },
          },
        },
      },
      skip,
      take: limit,
    };

    // Apply sorting or randomization
    if (random) {
      // For random sorting, first get all IDs matching the criteria
      const allParts = await this.prisma.part.findMany({
        where,
        select: { id: true },
      });

      // Shuffle IDs and take the required number
      const shuffledIds = allParts
        .map((p) => p.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);

      // Get the full part data for these random IDs
      const randomParts = await this.prisma.part.findMany({
        where: { id: { in: shuffledIds } },
        include: queryOptions.include,
      });

      // Enhance parts with filament colors
      const enhancedParts = await Promise.all(
        randomParts.map(async (part) => {
          let customizationOptions = part.customizationOptions;
          if (typeof customizationOptions === 'string') {
            try {
              customizationOptions = JSON.parse(customizationOptions);
            } catch (error) {
              console.error('Error parsing customizationOptions:', error);
            }
          }
          customizationOptions =
            await this.enhanceFilamentColorOptions(customizationOptions);
          return { ...part, customizationOptions };
        }),
      );

      return {
        data: enhancedParts,
        meta: { total, limit, skip, totalPages: Math.ceil(total / limit) },
      };
    } else {
      // Apply standard sorting
      queryOptions.orderBy = { [sortBy]: sortOrder };

      // Execute the query
      const parts = await this.prisma.part.findMany(queryOptions);

      // Enhance parts with filament colors
      const enhancedParts = await Promise.all(
        parts.map(async (part) => {
          let customizationOptions = part.customizationOptions;
          if (typeof customizationOptions === 'string') {
            try {
              customizationOptions = JSON.parse(customizationOptions);
            } catch (error) {
              console.error('Error parsing customizationOptions:', error);
            }
          }
          customizationOptions =
            await this.enhanceFilamentColorOptions(customizationOptions);
          return { ...part, customizationOptions };
        }),
      );

      return {
        data: enhancedParts,
        meta: { total, limit, skip, totalPages: Math.ceil(total / limit) },
      };
    }
  }

  async findAllWithStock(options: {
    status?: 'active' | 'inactive' | 'all';
    limit?: number;
    skip?: number;
    groupIds?: string[];
    sectionId?: string;
    random?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      status = 'active',
      limit = 20,
      skip = 0,
      groupIds,
      sectionId,
      random = false,
      sortBy = 'sortingRank',
      sortOrder = 'asc',
    } = options;

    // Build the where condition
    const where: any = {};

    // Apply status filter
    if (status !== 'all') {
      where.active = status === 'active';
    }

    // Apply group filter if groupIds are provided
    if (groupIds && groupIds.length > 0) {
      where.groups = { some: { id: { in: groupIds } } };
    }

    // Apply section filter if sectionId is provided
    if (sectionId) {
      where.sections = { some: { id: sectionId } };
    }

    // Get total count for pagination
    const total = await this.prisma.part.count({ where });

    // Build the query options
    const queryOptions: any = {
      where,
      include: {
        translations: true,
        groups: { include: { translations: true } },
        optionStocks: true, // Include stock information
        links: { include: { translations: true } },
        accessories: { include: { translations: true } },
        filamentTypes: {
          include: {
            colors: { where: { active: true } },
          },
        },
      },
      skip,
      take: limit,
    };

    let parts: any[];

    // Apply sorting or randomization
    if (random) {
      // For random sorting, first get all IDs matching the criteria
      const allParts = await this.prisma.part.findMany({
        where,
        select: { id: true },
      });

      // Shuffle IDs and take the required number
      const shuffledIds = allParts
        .map((p) => p.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);

      // Get the full part data for these random IDs
      parts = await this.prisma.part.findMany({
        where: { id: { in: shuffledIds } },
        include: queryOptions.include,
      });
    } else {
      // Apply standard sorting
      queryOptions.orderBy = { [sortBy]: sortOrder };

      // Execute the query
      parts = await this.prisma.part.findMany(queryOptions);
    }

    // Enhance each part with stock information in the customization options
    const partsWithStock = await Promise.all(
      parts.map(async (part) => {
        // Parse customization options
        let customizationOptions = part.customizationOptions;
        if (typeof customizationOptions === 'string') {
          try {
            customizationOptions = JSON.parse(customizationOptions);
          } catch (error) {
            console.error('Error parsing customizationOptions:', error);
            customizationOptions = part.customizationOptions;
          }
        }

        // Enhance with filament colors if needed
        customizationOptions =
          await this.enhanceFilamentColorOptions(customizationOptions);

        // Enhance dropdown options with stock information
        if (
          customizationOptions &&
          typeof customizationOptions === 'object' &&
          'options' in customizationOptions
        ) {
          const opts = customizationOptions as any;
          opts.options = opts.options.map(
            (option: any, optionIndex: number) => {
              if (option.type === 'dropdown' && option.items) {
                const enhancedItems = option.items.map((item: any) => {
                  const stockRecord = part.optionStocks.find(
                    (stock: any) =>
                      stock.optionId === optionIndex.toString() &&
                      stock.optionItemId === item.id,
                  );
                  return {
                    ...item,
                    stock: stockRecord ? stockRecord.quantity : 0,
                  };
                });
                return { ...option, items: enhancedItems };
              }
              return option;
            },
          );
          customizationOptions = opts;
        }

        // Return part without the raw optionStocks array, but with enhanced customizationOptions
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { optionStocks: _optionStocks, ...partWithoutStocks } = part;
        return { ...partWithoutStocks, customizationOptions };
      }),
    );

    return {
      data: partsWithStock,
      meta: { total, limit, skip, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(
    id: string,
    updatePartDto: Partial<UpdatePartDto>,
  ): Promise<any> {
    const part = await this.findOne(id, false); // Check if part exists

    if (!part) {
      throw new NotFoundException(`Part with ID ${id} not found`);
    }

    const {
      groups,
      translations,
      customizationOptions,
      shippingReady,
      shippingDate,
      images,
      videos,
      links,
      filamentTypeIds,
      ...updateData
    } = updatePartDto;

    console.log('Service received updatePartDto:', updatePartDto);
    console.log('Extracted groups:', groups);
    console.log('Extracted links:', links);
    console.log('Extracted filamentTypeIds:', filamentTypeIds);
    console.log('Extracted updateData:', updateData);

    try {
      // Update the part with Prisma
      return await this.prisma.part.update({
        where: { id },
        data: {
          ...updateData,
          // Update shipping ready status if provided
          ...(shippingReady !== undefined && {
            shippingReady: shippingReady as any,
          }),
          // Update shipping date if provided
          ...(shippingDate !== undefined && {
            shippingDate: shippingDate ? new Date(shippingDate) : null,
          }),
          // Update images if provided (replaces existing images)
          ...(images && { images: images }),
          // Update videos if provided (replaces existing videos)
          ...(videos && { videos: videos }),
          // Convert customizationOptions to JSON if present
          ...(customizationOptions && {
            customizationOptions:
              typeof customizationOptions === 'object'
                ? JSON.stringify(customizationOptions)
                : customizationOptions,
          }),

          // Update groups if provided (disconnect all and connect new ones)
          ...(groups && {
            groups: { set: groups.map((groupId) => ({ id: groupId })) },
          }),

          // Update filament types if provided (disconnect all and connect new ones)
          ...(filamentTypeIds !== undefined && {
            filamentTypes: {
              set: filamentTypeIds.map((id) => ({ id })),
            },
          }),

          // Update translations if provided (upsert for each language)
          ...(translations && {
            translations: {
              deleteMany: {},
              create: Object.entries(translations).map(
                ([language, content]) => ({
                  language,
                  title: content.title,
                  description: content.description || null,
                }),
              ),
            },
          }),

          // Update links if provided
          ...(links !== undefined && {
            links: {
              deleteMany: {}, // Delete all existing links
              ...(links.length > 0 && {
                create: links.map((link) => ({
                  translations: {
                    create: Object.entries(link.translations).map(
                      ([language, content]) => ({
                        language,
                        title: content.title,
                        url: content.url,
                      }),
                    ),
                  },
                })),
              }),
            },
          }),
        },
        include: {
          groups: true,
          translations: true,
          links: { include: { translations: true } },
          filamentTypes: {
            include: {
              colors: { where: { active: true } },
            },
          },
        },
      });
    } catch (error) {
      if ((error as any).code === 'P2002') {
        throw new BadRequestException('Part with this title already exists');
      }
      if ((error as any).code === 'P2003') {
        throw new BadRequestException('Invalid reference ID provided');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id, false); // Check if part exists
    await this.prisma.part.delete({ where: { id } });
  }

  async findAllByGroupId(groupId: string): Promise<part[]> {
    const partGroup = await this.prisma.part_group.findUnique({
      where: { id: groupId },
      include: {
        parts: {
          include: {
            translations: true,
            groups: true,
            links: { include: { translations: true } },
          },
        },
      },
    });

    if (!partGroup) {
      throw new NotFoundException(`Part Group with ID ${groupId} not found`);
    }

    return partGroup.parts;
  }

  async findAllByGroupName(groupName: string): Promise<any> {
    // Convert the input name to a slug for comparison
    const searchSlug = this.nameToSlug(groupName);

    // Get all part groups with their translations
    const partGroups = await this.prisma.part_group.findMany({
      include: {
        translations: true,
        parts: {
          include: {
            translations: true,
            groups: true,
            links: { include: { translations: true } },
          },
        },
      },
    });

    // Find part group where any translation's slugified title matches
    const partGroup = partGroups.find((pg) =>
      pg.translations.some((t) => this.nameToSlug(t.title) === searchSlug),
    );

    if (!partGroup) {
      throw new NotFoundException(
        `Part Group with name "${groupName}" not found`,
      );
    }

    // Return parts with group title translations
    return {
      groupTitles: partGroup.translations.reduce((acc, translation) => {
        acc[translation.language] = translation.title;
        return acc;
      }, {}),
      parts: partGroup.parts,
    };
  }

  // Stock management for dropdown options
  async updateOptionStock(
    partId: string,
    optionId: string,
    optionItemId: string,
    quantity: number,
  ): Promise<any> {
    // Verify the part exists
    await this.findOne(partId, false);

    // Upsert the option stock
    return await this.prisma.part_option_stock.upsert({
      where: {
        partId_optionId_optionItemId: { partId, optionId, optionItemId },
      },
      update: { quantity },
      create: { partId, optionId, optionItemId, quantity },
    });
  }

  async getOptionStock(
    partId: string,
    optionId?: string,
    optionItemId?: string,
  ): Promise<any[]> {
    const where: any = { partId };

    if (optionId) {
      where.optionId = optionId;
    }

    if (optionItemId) {
      where.optionItemId = optionItemId;
    }

    return await this.prisma.part_option_stock.findMany({
      where,
      orderBy: [{ optionId: 'asc' }, { optionItemId: 'asc' }],
    });
  }

  async decrementOptionStock(
    partId: string,
    optionId: string,
    optionItemId: string,
    amount: number,
  ): Promise<any> {
    // First check if stock exists and has enough quantity
    const currentStock = await this.prisma.part_option_stock.findUnique({
      where: {
        partId_optionId_optionItemId: { partId, optionId, optionItemId },
      },
    });

    if (!currentStock) {
      throw new BadRequestException(
        `No stock record found for part ${partId}, option ${optionId}, item ${optionItemId}`,
      );
    }

    if (currentStock.quantity < amount) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${currentStock.quantity}, Required: ${amount}`,
      );
    }

    // Decrement the stock
    return await this.prisma.part_option_stock.update({
      where: {
        partId_optionId_optionItemId: { partId, optionId, optionItemId },
      },
      data: { quantity: { decrement: amount } },
    });
  }

  async getPartWithStockInfo(id: string): Promise<any> {
    const part = await this.findOne(id, false);

    // Get all stock information for this part
    const optionStocks = await this.getOptionStock(id);

    // Parse customization options to add stock information
    let customizationOptions = part.customizationOptions;
    if (typeof customizationOptions === 'string') {
      try {
        customizationOptions = JSON.parse(customizationOptions);
      } catch (error) {
        console.error('Error parsing customizationOptions:', error);
      }
    }

    // Enhance with filament colors if needed (in case not already done)
    customizationOptions =
      await this.enhanceFilamentColorOptions(customizationOptions);

    // Enhance dropdown options with stock information
    if (
      customizationOptions &&
      typeof customizationOptions === 'object' &&
      'options' in customizationOptions
    ) {
      const opts = customizationOptions as any;
      opts.options = opts.options.map((option: any, optionIndex: number) => {
        if (option.type === 'dropdown' && option.items) {
          const enhancedItems = option.items.map((item: any) => {
            const stockRecord = optionStocks.find(
              (stock) =>
                stock.optionId === optionIndex.toString() &&
                stock.optionItemId === item.id,
            );
            return { ...item, stock: stockRecord ? stockRecord.quantity : 0 };
          });
          return { ...option, items: enhancedItems };
        }
        return option;
      });
      customizationOptions = opts;
    }

    return { ...part, customizationOptions, optionStocks };
  }

  async setAccessories(partId: string, accessoryIds: string[]): Promise<any> {
    // Verify the main part exists
    await this.findOne(partId, false);

    // Verify all accessory parts exist
    for (const accessoryId of accessoryIds) {
      const accessory = await this.prisma.part.findUnique({
        where: { id: accessoryId },
      });
      if (!accessory) {
        throw new NotFoundException(
          `Accessory part with ID ${accessoryId} not found`,
        );
      }
    }

    // Update the part with new accessories (replaces existing)
    return await this.prisma.part.update({
      where: { id: partId },
      data: {
        accessories: {
          set: accessoryIds.map((id) => ({ id })),
        },
      },
      include: {
        groups: true,
        translations: true,
        links: { include: { translations: true } },
        accessories: { include: { translations: true } },
        filamentTypes: {
          include: {
            colors: { where: { active: true } },
          },
        },
      },
    });
  }

  async setFilamentTypes(
    partId: string,
    filamentTypeIds: string[],
  ): Promise<any> {
    // Verify the main part exists
    await this.findOne(partId, false);

    // Verify all filament types exist
    for (const filamentTypeId of filamentTypeIds) {
      const filamentType = await this.prisma.filament_type.findUnique({
        where: { id: filamentTypeId },
      });
      if (!filamentType) {
        throw new NotFoundException(
          `Filament type with ID ${filamentTypeId} not found`,
        );
      }
    }

    // Update the part with new filament types (replaces existing)
    return await this.prisma.part.update({
      where: { id: partId },
      data: {
        filamentTypes: {
          set: filamentTypeIds.map((id) => ({ id })),
        },
      },
      include: {
        groups: true,
        translations: true,
        links: { include: { translations: true } },
        accessories: { include: { translations: true } },
        filamentTypes: {
          include: {
            colors: { where: { active: true } },
          },
        },
      },
    });
  }

  async getAvailableColorsForPart(partId: string): Promise<any[]> {
    const part = await this.prisma.part.findUnique({
      where: { id: partId },
      include: {
        filamentTypes: {
          include: {
            colors: { where: { active: true } },
          },
        },
      },
    });

    if (!part) {
      throw new NotFoundException(`Part with ID ${partId} not found`);
    }

    // Flatten all colors from all filament types
    const allColors = part.filamentTypes.flatMap((ft) =>
      ft.colors.map((color) => ({
        ...color,
        filamentTypeName: ft.name,
      })),
    );

    return allColors;
  }
}
