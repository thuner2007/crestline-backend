import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBikeModelDto, UpdateBikeModelDto } from './dto/bike-model.dto';

@Injectable()
export class BikeModelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBikeModelDto: CreateBikeModelDto): Promise<any> {
    try {
      return await this.prisma.bike_model.create({
        data: createBikeModelDto,
        include: {
          parts: {
            include: {
              translations: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'A bike model with this manufacturer, model, and year already exists',
        );
      }
      throw error;
    }
  }

  async findAll(options?: {
    status?: 'active' | 'inactive' | 'all';
    manufacturer?: string;
  }): Promise<any[]> {
    const { status = 'all', manufacturer } = options || {};

    const where: any = {};

    if (status !== 'all') {
      where.active = status === 'active';
    }

    if (manufacturer) {
      where.manufacturer = {
        contains: manufacturer,
        mode: 'insensitive',
      };
    }

    return await this.prisma.bike_model.findMany({
      where,
      include: {
        _count: {
          select: { parts: true },
        },
      },
      orderBy: [{ manufacturer: 'asc' }, { model: 'asc' }, { year: 'desc' }],
    });
  }

  async findOne(id: string): Promise<any> {
    const bikeModel = await this.prisma.bike_model.findUnique({
      where: { id },
      include: {
        parts: {
          include: {
            translations: true,
          },
        },
      },
    });

    if (!bikeModel) {
      throw new NotFoundException(`Bike model with ID ${id} not found`);
    }

    return bikeModel;
  }

  async update(
    id: string,
    updateBikeModelDto: UpdateBikeModelDto,
  ): Promise<any> {
    await this.findOne(id); // Check if exists

    try {
      return await this.prisma.bike_model.update({
        where: { id },
        data: updateBikeModelDto,
        include: {
          parts: {
            include: {
              translations: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'A bike model with this manufacturer, model, and year already exists',
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.prisma.bike_model.delete({ where: { id } });
  }

  async toggleActive(id: string): Promise<any> {
    const bikeModel = await this.findOne(id);
    return this.prisma.bike_model.update({
      where: { id },
      data: { active: !bikeModel.active },
      include: {
        parts: {
          include: {
            translations: true,
          },
        },
      },
    });
  }

  async getManufacturers(): Promise<string[]> {
    const manufacturers = await this.prisma.bike_model.findMany({
      select: { manufacturer: true },
      distinct: ['manufacturer'],
      orderBy: { manufacturer: 'asc' },
    });

    return manufacturers.map((m) => m.manufacturer);
  }
}
