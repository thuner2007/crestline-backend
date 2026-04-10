import { Module } from '@nestjs/common';
import { VariationController } from './variation.controller';
import { VariationService } from './variation.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [VariationController],
  providers: [VariationService, PrismaService],
  exports: [VariationService],
})
export class VariationModule {}
