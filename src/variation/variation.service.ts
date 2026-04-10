import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreateVariationGroupDto,
  UpdateVariationGroupDto,
} from './dto/variation.dto';

@Injectable()
export class VariationService {
  constructor(private readonly prisma: PrismaService) {}

  async createVariationGroup(
    createVariationGroupDto: CreateVariationGroupDto,
  ): Promise<any> {
    const { name, stickerIds } = createVariationGroupDto;

    try {
      // Create the variation group
      const variationGroup = await this.prisma.variation_group.create({
        data: {
          name,
          // Connect stickers if provided
          ...(stickerIds && stickerIds.length > 0
            ? {
                stickers: {
                  connect: stickerIds.map((id) => ({ id })),
                },
              }
            : {}),
        },
        include: {
          stickers: {
            include: {
              translations: true,
            },
          },
        },
      });

      return variationGroup;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Variation group with name '${name}' already exists`,
        );
      } else if (error.code === 'P2025') {
        throw new NotFoundException(
          'One or more provided sticker IDs do not exist',
        );
      }
      throw error;
    }
  }

  async findAllVariationGroups(): Promise<any[]> {
    return this.prisma.variation_group.findMany({
      // include: {
      //   stickers: {
      //     include: {
      //       translations: true,
      //     },
      //   },
      // },
    });
  }

  async findVariationGroupById(id: string): Promise<any> {
    const variationGroup = await this.prisma.variation_group.findUnique({
      where: { id },
      include: {
        stickers: {
          include: {
            translations: true,
            groups: true,
            subgroups: true,
          },
        },
      },
    });

    if (!variationGroup) {
      throw new NotFoundException(`Variation group with ID ${id} not found`);
    }

    return variationGroup;
  }

  async updateVariationGroup(
    id: string,
    updateVariationGroupDto: UpdateVariationGroupDto,
  ): Promise<any> {
    const { name, stickerIds } = updateVariationGroupDto;

    // Check if variation group exists
    await this.findVariationGroupById(id);

    try {
      return await this.prisma.variation_group.update({
        where: { id },
        data: {
          ...(name ? { name } : {}),
          // If stickerIds is provided, replace all stickers
          ...(stickerIds
            ? {
                stickers: {
                  set: [], // Remove all current stickers
                  connect: stickerIds.map((stickerId) => ({ id: stickerId })),
                },
              }
            : {}),
        },
        include: {
          stickers: {
            include: {
              translations: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Variation group with name '${name}' already exists`,
        );
      } else if (error.code === 'P2025') {
        throw new NotFoundException(
          'One or more provided sticker IDs do not exist',
        );
      }
      throw error;
    }
  }

  async deleteVariationGroup(id: string): Promise<void> {
    // Check if variation group exists
    await this.findVariationGroupById(id);

    // Delete the variation group
    await this.prisma.variation_group.delete({
      where: { id },
    });
  }

  async addStickerToVariationGroup(
    id: string,
    stickerId: string,
  ): Promise<any> {
    // Check if variation group exists
    await this.findVariationGroupById(id);

    // Check if sticker exists
    const sticker = await this.prisma.sticker.findUnique({
      where: { id: stickerId },
    });

    if (!sticker) {
      throw new NotFoundException(`Sticker with ID ${stickerId} not found`);
    }

    // Check if sticker is already in another variation group
    if (sticker.variationsGroupId && sticker.variationsGroupId !== id) {
      throw new BadRequestException(
        `Sticker with ID ${stickerId} already belongs to another variation group`,
      );
    }

    // Add sticker to variation group
    return this.prisma.variation_group.update({
      where: { id },
      data: {
        stickers: {
          connect: { id: stickerId },
        },
      },
      include: {
        stickers: {
          include: {
            translations: true,
          },
        },
      },
    });
  }

  async removeStickerFromVariationGroup(
    id: string,
    stickerId: string,
  ): Promise<any> {
    // Check if variation group exists
    await this.findVariationGroupById(id);

    // Check if sticker exists and belongs to this variation group
    const sticker = await this.prisma.sticker.findFirst({
      where: {
        id: stickerId,
        variationsGroupId: id,
      },
    });

    if (!sticker) {
      throw new NotFoundException(
        `Sticker with ID ${stickerId} not found in variation group ${id}`,
      );
    }

    // Remove sticker from variation group
    return this.prisma.variation_group.update({
      where: { id },
      data: {
        stickers: {
          disconnect: { id: stickerId },
        },
      },
      include: {
        stickers: {
          include: {
            translations: true,
          },
        },
      },
    });
  }
}
