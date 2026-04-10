import { Module } from '@nestjs/common';
import { PowdercoatColorsController } from './powdercoatColors.controller';
import { PowdercoatColorsService } from './powdercoatColors.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [PowdercoatColorsController],
  providers: [PowdercoatColorsService, PrismaService],
  exports: [PowdercoatColorsService],
})
export class PowdercoatColorsModule {}
