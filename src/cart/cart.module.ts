import { Logger, Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  controllers: [CartController],
  providers: [CartService, PrismaService, Logger],
  exports: [CartService],
})
export class CartModule {}
