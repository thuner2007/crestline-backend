import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class PowdercoatColorsService {
  constructor(private prisma: PrismaService) {}

  async getAllColors(includeInactive = false): Promise<string[]> {
    const colors = await this.prisma.powdercoat_color.findMany({
      where: includeInactive ? undefined : { active: true },
    });
    return colors.map((c) => c.color);
  }

  async setColors(colors: string[]): Promise<string[]> {
    // Delete all existing colors
    await this.prisma.powdercoat_color.deleteMany({});

    // Create new colors
    await this.prisma.powdercoat_color.createMany({
      data: colors.map((color) => ({ color })),
    });

    return colors;
  }

  async addColor(newColor: string): Promise<string> {
    await this.prisma.powdercoat_color.create({ data: { color: newColor } });
    return newColor;
  }

  async updateColor(id: string, newColor: string): Promise<any> {
    const color = await this.prisma.powdercoat_color.findUnique({
      where: { id },
    });

    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    return this.prisma.powdercoat_color.update({
      where: { id },
      data: { color: newColor },
    });
  }

  async toggleActive(id: string): Promise<any> {
    const color = await this.prisma.powdercoat_color.findUnique({
      where: { id },
    });

    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    return this.prisma.powdercoat_color.update({
      where: { id },
      data: { active: !color.active },
    });
  }

  async deleteColorByName(colorName: string): Promise<void> {
    const color = await this.prisma.powdercoat_color.findFirst({
      where: { color: colorName },
    });

    if (!color) {
      throw new NotFoundException(`Color "${colorName}" not found`);
    }

    await this.prisma.powdercoat_color.delete({
      where: { id: color.id },
    });
  }

  async getColorById(id: string): Promise<any> {
    const color = await this.prisma.powdercoat_color.findUnique({
      where: { id },
    });

    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    return color;
  }
}
