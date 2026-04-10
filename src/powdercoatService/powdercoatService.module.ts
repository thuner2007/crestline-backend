import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { PowdercoatServiceController } from './powdercoatService.controller';
import { PowdercoatServiceService } from './powdercoatService.service';
import { PowdercoatColorsService } from '../powdercoatColors/powdercoatColors.service';
import { MinioService } from '../storage/minio.service';

@Module({
  controllers: [PowdercoatServiceController],
  providers: [
    PowdercoatServiceService,
    PrismaService,
    PowdercoatColorsService,
    MinioService,
  ],
  exports: [PowdercoatServiceService],
})
export class PowdercoatServiceModule {}
