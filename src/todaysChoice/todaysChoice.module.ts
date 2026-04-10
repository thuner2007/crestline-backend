import { Module } from '@nestjs/common';
import { TodaysChoiceController } from './todaysChoice.controller';
import { TodaysChoiceService } from './todaysChoice.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [TodaysChoiceController],
  providers: [TodaysChoiceService, PrismaService],
  exports: [TodaysChoiceService],
})
export class TodaysChoiceModule {}
