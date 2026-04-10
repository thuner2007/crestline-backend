import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TrackerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async findOne(path: string) {
    return this.prisma.tracker.findUnique({ where: { path } });
  }

  async findAll() {
    return this.prisma.tracker.findMany();
  }

  async addVisit(path: string) {
    this.logger.log(`Adding visit for path: ${path}`);
    return this.prisma.tracker.upsert({
      where: { path },
      update: {
        visits: { increment: 1 },
        lastVisit: new Date(),
      },
      create: {
        path,
        visits: 1,
        lastVisit: new Date(),
      },
    });
  }

  async resetAll() {
    return this.prisma.tracker.updateMany({
      data: { visits: 0 },
    });
  }

  async resetOne(path: string) {
    return this.prisma.tracker.update({
      where: { path },
      data: { visits: 0 },
    });
  }
}
