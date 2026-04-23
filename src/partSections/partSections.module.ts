import { Module } from '@nestjs/common';
import { PartSectionsController } from './partSections.controller';
import { PartSectionsService } from './partSections.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [PartSectionsController],
  providers: [PartSectionsService, PrismaService],
  exports: [PartSectionsService],
})
export class PartSectionsModule {}
