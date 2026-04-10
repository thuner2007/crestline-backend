import { Module } from '@nestjs/common';
import { DiscountController } from './discounts.controller';
import { DiscountService } from './discount.service';
import { PrismaService } from 'prisma/prisma.service';

@Module({
  controllers: [DiscountController],
  providers: [DiscountService, PrismaService],
  exports: [DiscountService],
})
export class DiscountsModule {}
