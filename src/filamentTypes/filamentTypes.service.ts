import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class FilamentTypesService {
  constructor(private prisma: PrismaService) {}

  async getAll(includeInactive = false) {
    return this.prisma.filament_type.findMany({
      where: includeInactive ? undefined : { active: true },
      include: {
        _count: {
          select: { colors: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string) {
    const filamentType = await this.prisma.filament_type.findUnique({
      where: { id },
      include: {
        colors: true,
        _count: {
          select: { colors: true },
        },
      },
    });

    if (!filamentType) {
      throw new NotFoundException(`Filament type with ID ${id} not found`);
    }

    return filamentType;
  }

  async getByName(name: string) {
    const filamentType = await this.prisma.filament_type.findUnique({
      where: { name },
      include: {
        colors: true,
        _count: {
          select: { colors: true },
        },
      },
    });

    if (!filamentType) {
      throw new NotFoundException(`Filament type "${name}" not found`);
    }

    return filamentType;
  }

  async create(data: { name: string; description?: string; active?: boolean }) {
    try {
      return await this.prisma.filament_type.create({
        data: {
          name: data.name,
          description: data.description,
          active: data.active ?? true,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Filament type with name "${data.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      active?: boolean;
    },
  ) {
    const filamentType = await this.prisma.filament_type.findUnique({
      where: { id },
    });

    if (!filamentType) {
      throw new NotFoundException(`Filament type with ID ${id} not found`);
    }

    try {
      return await this.prisma.filament_type.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Filament type with name "${data.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async toggleActive(id: string) {
    const filamentType = await this.prisma.filament_type.findUnique({
      where: { id },
    });

    if (!filamentType) {
      throw new NotFoundException(`Filament type with ID ${id} not found`);
    }

    return this.prisma.filament_type.update({
      where: { id },
      data: { active: !filamentType.active },
    });
  }

  async delete(id: string) {
    const filamentType = await this.prisma.filament_type.findUnique({
      where: { id },
      include: {
        _count: {
          select: { colors: true },
        },
      },
    });

    if (!filamentType) {
      throw new NotFoundException(`Filament type with ID ${id} not found`);
    }

    if (filamentType._count.colors > 0) {
      throw new ConflictException(
        `Cannot delete filament type "${filamentType.name}" because it has ${filamentType._count.colors} associated colors`,
      );
    }

    await this.prisma.filament_type.delete({
      where: { id },
    });
  }
}
