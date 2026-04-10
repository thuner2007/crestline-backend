import { Module } from '@nestjs/common';
import { BikeModelsController } from './bike-models.controller';
import { BikeModelsService } from './bike-models.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [BikeModelsController],
  providers: [BikeModelsService, PrismaService],
  exports: [BikeModelsService],
})
export class BikeModelsModule {}
