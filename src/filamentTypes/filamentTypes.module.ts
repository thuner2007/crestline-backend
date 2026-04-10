import { Module } from '@nestjs/common';
import { FilamentTypesController } from './filamentTypes.controller';
import { FilamentTypesService } from './filamentTypes.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [FilamentTypesController],
  providers: [FilamentTypesService, PrismaService],
  exports: [FilamentTypesService],
})
export class FilamentTypesModule {}
