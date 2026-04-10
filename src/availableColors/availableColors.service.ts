import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AvailableColorsService {
  constructor(private prisma: PrismaService) {
    this.initializeDefaultColors();
  }

  private async initializeDefaultColors() {
    const count = await this.prisma.available_color.count();
    if (count === 0) {
      await this.setColors(['black', 'white']);
    }
  }

  async getAllColors(includeInactive = false): Promise<string[]> {
    const colors = await this.prisma.available_color.findMany({
      where: includeInactive ? undefined : { active: true },
    });
    return colors.map((c) => c.color);
  }

  async getColorsByFilamentType(
    filamentType: string,
    includeInactive = false,
  ): Promise<any[]> {
    const colors = await this.prisma.available_color.findMany({
      where: {
        filamentType,
        ...(includeInactive ? {} : { active: true }),
      },
    });
    return colors;
  }

  async setColors(colors: string[]): Promise<string[]> {
    // Delete all existing colors
    await this.prisma.available_color.deleteMany({});

    // Create new colors with default PLA filament type
    await this.prisma.available_color.createMany({
      data: colors.map((color) => ({ color, filamentType: 'PLA' })),
    });

    return colors;
  }

  async addColor(newColor: string, filamentType = 'PLA'): Promise<any> {
    return this.prisma.available_color.create({
      data: { color: newColor, filamentType },
    });
  }

  async addColorToFilamentType(
    filamentType: string,
    color: string,
  ): Promise<any> {
    return this.prisma.available_color.create({
      data: { color, filamentType },
    });
  }

  async setColorsForFilamentType(filamentType: string): Promise<any[]> {
    // Delete existing colors for this filament type
    await this.prisma.available_color.deleteMany({
      where: { filamentType },
    });

    // Return the created colors
    return this.prisma.available_color.findMany({
      where: { filamentType },
    });
  }

  async updateColor(id: string, newColor: string): Promise<any> {
    const color = await this.prisma.available_color.findUnique({
      where: { id },
    });

    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    return this.prisma.available_color.update({
      where: { id },
      data: { color: newColor },
    });
  }

  async toggleActive(id: string): Promise<any> {
    const color = await this.prisma.available_color.findUnique({
      where: { id },
    });

    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    return this.prisma.available_color.update({
      where: { id },
      data: { active: !color.active },
    });
  }

  async deleteColorByName(colorName: string): Promise<void> {
    const color = await this.prisma.available_color.findFirst({
      where: { color: colorName },
    });

    if (!color) {
      throw new NotFoundException(`Color "${colorName}" not found`);
    }

    await this.prisma.available_color.delete({
      where: { id: color.id },
    });
  }

  async getColorById(id: string): Promise<any> {
    const color = await this.prisma.available_color.findUnique({
      where: { id },
    });

    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    return color;
  }

  async deleteColorFromFilamentType(
    filamentType: string,
    colorId: string,
  ): Promise<void> {
    const color = await this.prisma.available_color.findFirst({
      where: { id: colorId, filamentType },
    });

    if (!color) {
      throw new NotFoundException(
        `Color with ID ${colorId} not found for filament type ${filamentType}`,
      );
    }

    await this.prisma.available_color.delete({
      where: { id: colorId },
    });
  }
}
