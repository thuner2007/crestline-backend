import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto, CreatePartGroupDto } from './dto/group.dto';
import { CreateSubgroupDto } from './dto/subgroup.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {
    this.initializeOthersGroup();
  }

  private async initializeOthersGroup() {
    const othersGroup = await this.prisma.group.findFirst({
      where: {
        translations: {
          some: {
            title: 'Others',
          },
        },
      },
    });

    if (!othersGroup) {
      await this.prisma.group.create({
        data: {
          translations: {
            create: {
              language: 'en',
              title: 'Others',
            },
          },
        },
      });
    }
  }

  async createGroup(createGroupDto: CreateGroupDto): Promise<any> {
    return this.prisma.group.create({
      data: {
        translations: {
          create: [
            {
              language: 'en',
              title: createGroupDto.translations.en.title,
            },
            ...(createGroupDto.translations.de
              ? [
                  {
                    language: 'de',
                    title: createGroupDto.translations.de.title,
                  },
                ]
              : []),
            ...(createGroupDto.translations.fr
              ? [
                  {
                    language: 'fr',
                    title: createGroupDto.translations.fr.title,
                  },
                ]
              : []),
            ...(createGroupDto.translations.it
              ? [
                  {
                    language: 'it',
                    title: createGroupDto.translations.it.title,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        translations: true,
        subgroups: true,
      },
    });
  }

  async createPartGroup(createPartGroupDto: CreatePartGroupDto): Promise<any> {
    return this.prisma.part_group.create({
      data: {
        image: createPartGroupDto.image,
        translations: {
          create: [
            {
              language: 'en',
              title: createPartGroupDto.translations.en.title,
            },
            ...(createPartGroupDto.translations.de
              ? [
                  {
                    language: 'de',
                    title: createPartGroupDto.translations.de.title,
                  },
                ]
              : []),
            ...(createPartGroupDto.translations.fr
              ? [
                  {
                    language: 'fr',
                    title: createPartGroupDto.translations.fr.title,
                  },
                ]
              : []),
            ...(createPartGroupDto.translations.it
              ? [
                  {
                    language: 'it',
                    title: createPartGroupDto.translations.it.title,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        translations: true,
        parts: true,
      },
    });
  }

  async createSubgroup(createSubgroupDto: CreateSubgroupDto): Promise<any> {
    const group = await this.prisma.group.findUnique({
      where: { id: createSubgroupDto.groupId },
    });

    if (!group) {
      throw new NotFoundException(
        `Group with ID ${createSubgroupDto.groupId} not found`,
      );
    }

    return this.prisma.subgroup.create({
      data: {
        translations: {
          create: [
            {
              language: 'en',
              title: createSubgroupDto.translations.en.name,
            },
            ...(createSubgroupDto.translations.de
              ? [
                  {
                    language: 'de',
                    title: createSubgroupDto.translations.de.name,
                  },
                ]
              : []),
            ...(createSubgroupDto.translations.fr
              ? [
                  {
                    language: 'fr',
                    title: createSubgroupDto.translations.fr.name,
                  },
                ]
              : []),
            ...(createSubgroupDto.translations.it
              ? [
                  {
                    language: 'it',
                    title: createSubgroupDto.translations.it.name,
                  },
                ]
              : []),
          ],
        },
        groups: {
          connect: [{ id: createSubgroupDto.groupId }], // Connect the group directly
        },
      },
      include: {
        translations: true,
        groups: {
          include: {
            translations: true,
          },
        },
      },
    });
  }

  async findGroupById(id: string): Promise<any> {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        translations: true,
        subgroups: true,
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async findPartGroupById(id: string): Promise<any> {
    const partGroup = await this.prisma.part_group.findUnique({
      where: { id },
      include: {
        translations: true,
        parts: true,
      },
    });

    if (!partGroup) {
      throw new NotFoundException(`Part Group with ID ${id} not found`);
    }

    return partGroup;
  }

  async findSubgroupsByGroupId(id: string): Promise<any[]> {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        subgroups: true,
      },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    // Map to get just the subgroups
    return group.subgroups.map((gs) => ({
      ...gs,
      groupId: id,
    }));
  }

  async findAllGroups(): Promise<any[]> {
    return this.prisma.group.findMany({
      include: {
        translations: true,
        subgroups: true,
      },
    });
  }

  async findAllPartGroups(): Promise<any[]> {
    return this.prisma.part_group.findMany({
      include: {
        translations: true,
        parts: true,
      },
    });
  }

  async findSubgroupById(id: string): Promise<any> {
    const subgroup = await this.prisma.subgroup.findUnique({
      where: { id },
      include: {
        translations: true,
        groups: true,
      },
    });

    if (!subgroup) {
      throw new NotFoundException(`Subgroup with ID ${id} not found`);
    }

    return subgroup;
  }

  async findAllSubgroups(): Promise<any[]> {
    return this.prisma.subgroup.findMany({
      include: {
        translations: true,
        groups: true,
      },
    });
  }

  async findAllGroupsAndSubgroups(): Promise<any[]> {
    return this.prisma.group.findMany({
      include: {
        translations: true,
        subgroups: {
          include: {
            translations: true,
          },
        },
      },
    });
  }

  async deleteGroup(id: string): Promise<void> {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    // Prisma will handle cascade deletion through the schema's onDelete: Cascade
    await this.prisma.group.delete({
      where: { id },
    });
  }

  async deletePartGroup(id: string): Promise<void> {
    const partGroup = await this.prisma.part_group.findUnique({
      where: { id },
    });

    if (!partGroup) {
      throw new NotFoundException(`Part Group with ID ${id} not found`);
    }

    // Prisma will handle cascade deletion through the schema's onDelete: Cascade
    await this.prisma.part_group.delete({
      where: { id },
    });
  }

  async deleteSubgroup(id: string): Promise<void> {
    const subgroup = await this.prisma.subgroup.findUnique({
      where: { id },
    });

    if (!subgroup) {
      throw new NotFoundException(`Subgroup with ID ${id} not found`);
    }

    // Delete the subgroup - relationships will be handled through cascade delete
    await this.prisma.subgroup.delete({
      where: { id },
    });
  }

  async updateGroup(
    id: string,
    name: string,
    translations: CreateGroupDto['translations'],
  ): Promise<any> {
    // Check if group exists
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    // Delete existing translations
    await this.prisma.group_translation.deleteMany({
      where: { groupId: id },
    });

    // Create new translations
    return this.prisma.group.update({
      where: { id },
      data: {
        translations: {
          create: [
            {
              language: 'en',
              title: translations.en.title,
            },
            ...(translations.de
              ? [
                  {
                    language: 'de',
                    title: translations.de.title,
                  },
                ]
              : []),
            ...(translations.fr
              ? [
                  {
                    language: 'fr',
                    title: translations.fr.title,
                  },
                ]
              : []),
            ...(translations.it
              ? [
                  {
                    language: 'it',
                    title: translations.it.title,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        translations: true,
        subgroups: true,
      },
    });
  }

  async updatePartGroup(
    id: string,
    name: string,
    translations: CreatePartGroupDto['translations'],
    image?: string,
  ): Promise<any> {
    // Check if part group exists
    const partGroup = await this.prisma.part_group.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!partGroup) {
      throw new NotFoundException(`Part Group with ID ${id} not found`);
    }

    // Delete existing translations
    await this.prisma.part_group_translation.deleteMany({
      where: { partGroupId: id },
    });

    // Create new translations
    return this.prisma.part_group.update({
      where: { id },
      data: {
        image: image,
        translations: {
          create: [
            {
              language: 'en',
              title: translations.en.title,
            },
            ...(translations.de
              ? [
                  {
                    language: 'de',
                    title: translations.de.title,
                  },
                ]
              : []),
            ...(translations.fr
              ? [
                  {
                    language: 'fr',
                    title: translations.fr.title,
                  },
                ]
              : []),
            ...(translations.it
              ? [
                  {
                    language: 'it',
                    title: translations.it.title,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        translations: true,
        parts: true,
      },
    });
  }

  async updateSubgroup(
    id: string,
    name: string,
    translations: CreateSubgroupDto['translations'],
  ): Promise<any> {
    // Check if subgroup exists
    const subgroup = await this.prisma.subgroup.findUnique({
      where: { id },
      include: { translations: true },
    });

    if (!subgroup) {
      throw new NotFoundException(`Subgroup with ID ${id} not found`);
    }

    // Delete existing translations
    await this.prisma.subgroup_translation.deleteMany({
      where: { subgroupId: id },
    });

    // Create new translations
    return this.prisma.subgroup.update({
      where: { id },
      data: {
        translations: {
          create: [
            {
              language: 'en',
              title: translations.en.name,
            },
            ...(translations.de
              ? [
                  {
                    language: 'de',
                    title: translations.de.name,
                  },
                ]
              : []),
            ...(translations.fr
              ? [
                  {
                    language: 'fr',
                    title: translations.fr.name,
                  },
                ]
              : []),
            ...(translations.it
              ? [
                  {
                    language: 'it',
                    title: translations.it.name,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        translations: true,
        groups: true,
      },
    });
  }
}
