import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreatePowdercoatServiceDto } from './dto/create-powdercoat-service.dto';
import { UpdatePowdercoatServiceDto } from './dto/update-powdercoat-service.dto';

@Injectable()
export class PowdercoatServiceService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreatePowdercoatServiceDto) {
    return this.prisma.powdercoating_service.create({
      data: {
        name: createDto.name,
        images: createDto.images,
        description: createDto.description || null,
        price: createDto.price,
        active: createDto.active ?? true,
      },
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.powdercoating_service.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.powdercoating_service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Powdercoat service with ID ${id} not found`);
    }

    return service;
  }

  // Helper method to convert name to URL-friendly slug
  private nameToSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-') // Replace special characters and spaces with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  async findOneByName(name: string) {
    // Convert the input name to a slug for comparison
    const searchSlug = this.nameToSlug(name);

    // Get all services and find the one with matching slug
    const services = await this.prisma.powdercoating_service.findMany();

    // Find service where the slugified name matches
    const service = services.find(
      (s) => this.nameToSlug(s.name) === searchSlug,
    );

    if (!service) {
      throw new NotFoundException(
        `Powdercoat service with name "${name}" not found`,
      );
    }

    return service;
  }

  async update(id: string, updateDto: UpdatePowdercoatServiceDto) {
    // Check if service exists
    await this.findOne(id);

    const updateData: any = {};

    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.images !== undefined) updateData.images = updateDto.images;
    if (updateDto.description !== undefined)
      updateData.description = updateDto.description;
    if (updateDto.price !== undefined) updateData.price = updateDto.price;
    if (updateDto.active !== undefined) updateData.active = updateDto.active;

    return this.prisma.powdercoating_service.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    // Check if service exists
    await this.findOne(id);

    await this.prisma.powdercoating_service.delete({ where: { id } });

    return { message: 'Powdercoat service deleted successfully' };
  }

  async toggleActive(id: string) {
    const service = await this.findOne(id);

    return this.prisma.powdercoating_service.update({
      where: { id },
      data: { active: !service.active },
    });
  }
}
