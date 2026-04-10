import { Module } from '@nestjs/common';
import { PartsController } from './parts.controller';
import { PartsService } from './parts.service';
import { MinioService } from 'src/storage/minio.service';
import { PrismaService } from 'prisma/prisma.service';
import { PowdercoatColorsService } from 'src/powdercoatColors/powdercoatColors.service';

@Module({
  controllers: [PartsController],
  providers: [
    PartsService,
    MinioService,
    PrismaService,
    PowdercoatColorsService,
  ],
  exports: [PartsService],
})
export class PartsModule {}
