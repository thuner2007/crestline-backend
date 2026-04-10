import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class IncompleteOrderCleanupService implements OnModuleInit {
  private readonly logger = new Logger(IncompleteOrderCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log(
      '[Incomplete Order Cleanup] Service initialized - Running every week to check cart_temp orders with incomplete data',
    );
  }

  @Cron(CronExpression.EVERY_WEEK)
  async checkIncompleteOrders() {
    try {
      const deleteResult = await this.prisma.sticker_order.deleteMany({
        where: {
          status: 'cart_temp',
          firstName: null,
          lastName: null,
          phone: null,
          street: null,
        },
      });

      this.logger.log(
        `[Incomplete Order Cleanup] Deleted ${deleteResult.count} cart_temp orders with no customer data`,
      );
    } catch (error) {
      this.logger.error(
        `[Incomplete Order Cleanup] Failed: ${error.message}`,
        error.stack || '',
      );
    }
  }
}
