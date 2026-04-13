import { Module } from '@nestjs/common';
import { PartsController } from './parts.controller';
import { PartsService } from './parts.service';
import { MinioService } from 'src/storage/minio.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [PartsController],
  providers: [PartsService, MinioService, PrismaService],
  exports: [PartsService],
})
export class PartsModule {}
