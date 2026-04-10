import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TodaysChoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const choices = await this.prisma.todays_choice.findMany();

    return choices;
  }

  async create(data: { stickerId?: string; partId?: string }) {
    if (!data.stickerId && !data.partId) {
      throw new BadRequestException(
        'Either stickerId or partId must be provided',
      );
    }

    // Validate sticker or part exists
    if (data.stickerId) {
      const sticker = await this.prisma.sticker.findUnique({
        where: { id: data.stickerId },
      });
      if (!sticker) {
        throw new NotFoundException(
          `Sticker with ID ${data.stickerId} not found`,
        );
      }
    }

    if (data.partId) {
      const part = await this.prisma.part.findUnique({
        where: { id: data.partId },
      });
      if (!part) {
        throw new NotFoundException(`Part with ID ${data.partId} not found`);
      }
    }

    return this.prisma.todays_choice.create({
      data,
    });
  }

  async update(id: string, data: { stickerId?: string; partId?: string }) {
    // Check if record exists
    const choice = await this.prisma.todays_choice.findUnique({
      where: { id },
    });

    if (!choice) {
      throw new NotFoundException(`Today's choice with ID ${id} not found`);
    }

    // Validate sticker or part exists if provided
    if (data.stickerId) {
      const sticker = await this.prisma.sticker.findUnique({
        where: { id: data.stickerId },
      });
      if (!sticker) {
        throw new NotFoundException(
          `Sticker with ID ${data.stickerId} not found`,
        );
      }
    }

    if (data.partId) {
      const part = await this.prisma.part.findUnique({
        where: { id: data.partId },
      });
      if (!part) {
        throw new NotFoundException(`Part with ID ${data.partId} not found`);
      }
    }

    return this.prisma.todays_choice.update({
      where: { id },
      data,
      include: {
        sticker: {
          include: {
            translations: true,
          },
        },
        part: {
          include: {
            translations: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    // Check if record exists
    const choice = await this.prisma.todays_choice.findUnique({
      where: { id },
    });

    if (!choice) {
      throw new NotFoundException(`Today's choice with ID ${id} not found`);
    }

    return this.prisma.todays_choice.delete({
      where: { id },
    });
  }
}
