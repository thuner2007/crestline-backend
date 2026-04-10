import { Module } from '@nestjs/common';
import { AvailableColorsController } from './availableColors.controller';
import { AvailableColorsService } from './availableColors.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [AvailableColorsController],
  providers: [AvailableColorsService, PrismaService],
  exports: [AvailableColorsService],
})
export class AvailableColorsModule {}
