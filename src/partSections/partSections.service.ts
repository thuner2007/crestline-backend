import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  CreatePartSectionDto,
  UpdatePartSectionDto,
} from './dto/part-section.dto';

@Injectable()
export class PartSectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePartSectionDto): Promise<any> {
    const translationEntries = Object.entries(dto.translations)
      .filter(([, val]) => val && val.title)
      .map(([language, val]) => ({
        language,
        title: val!.title,
        description: val!.description ?? null,
      }));

    return this.prisma.part_section.create({
      data: {
        sortingRank: dto.sortingRank ?? 0,
        active: dto.active ?? true,
        translations: { create: translationEntries },
      },
      include: {
        translations: true,
        parts: { include: { translations: true } },
      },
    });
  }

  async findAll(includeInactive = false): Promise<any[]> {
    return this.prisma.part_section.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { sortingRank: 'asc' },
      include: {
        translations: true,
        parts: {
          where: { active: true },
          include: { translations: true },
          orderBy: { sortingRank: 'asc' },
        },
      },
    });
  }

  async findAllAdmin(): Promise<any[]> {
    return this.prisma.part_section.findMany({
      orderBy: { sortingRank: 'asc' },
      include: {
        translations: true,
        _count: { select: { parts: true } },
      },
    });
  }

  async findOne(id: string): Promise<any> {
    const section = await this.prisma.part_section.findUnique({
      where: { id },
      include: {
        translations: true,
        parts: {
          include: { translations: true },
          orderBy: { sortingRank: 'asc' },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Part section with ID ${id} not found`);
    }

    return section;
  }

  async update(id: string, dto: UpdatePartSectionDto): Promise<any> {
    await this.findOne(id);

    const data: any = {};

    if (dto.sortingRank !== undefined) data.sortingRank = dto.sortingRank;
    if (dto.active !== undefined) data.active = dto.active;

    if (dto.translations) {
      // Upsert each translation
      for (const [language, val] of Object.entries(dto.translations)) {
        if (!val) continue;
        await this.prisma.part_section_translation.upsert({
          where: { partSectionId_language: { partSectionId: id, language } },
          create: {
            partSectionId: id,
            language,
            title: val.title,
            description: val.description ?? null,
          },
          update: {
            title: val.title,
            description: val.description ?? null,
          },
        });
      }
    }

    return this.prisma.part_section.update({
      where: { id },
      data,
      include: {
        translations: true,
        parts: { include: { translations: true } },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.part_section.delete({ where: { id } });
  }

  async assignParts(id: string, partIds: string[]): Promise<any> {
    await this.findOne(id);

    return this.prisma.part_section.update({
      where: { id },
      data: {
        parts: { set: partIds.map((pid) => ({ id: pid })) },
      },
      include: {
        translations: true,
        parts: { include: { translations: true } },
      },
    });
  }

  async addPart(sectionId: string, partId: string): Promise<any> {
    await this.findOne(sectionId);

    return this.prisma.part_section.update({
      where: { id: sectionId },
      data: {
        parts: { connect: { id: partId } },
      },
      include: {
        translations: true,
        parts: { include: { translations: true } },
      },
    });
  }

  async removePart(sectionId: string, partId: string): Promise<any> {
    await this.findOne(sectionId);

    return this.prisma.part_section.update({
      where: { id: sectionId },
      data: {
        parts: { disconnect: { id: partId } },
      },
      include: {
        translations: true,
        parts: { include: { translations: true } },
      },
    });
  }
}
