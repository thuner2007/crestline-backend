import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CartService } from '../cart/cart.service';

@Injectable()
export class CartCleanupService implements OnModuleInit {
  private readonly logger = new Logger(CartCleanupService.name);

  constructor(private readonly cartService: CartService) {}

  onModuleInit() {
    this.logger.log(
      '[Cart Cleanup] Service initialized - Running every hour to cleanup expired anonymous carts (72h+ old)',
    );
  }

  /**
   * Runs every hour to cleanup expired anonymous carts
   * Anonymous carts expire after 72 hours of creation
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredAnonymousCarts() {
    try {
      const result = await this.cartService.cleanupExpiredAnonymousCarts();
      this.logger.log(`[Cart Cleanup] ${result.message}`);
    } catch (error) {
      this.logger.error(
        `[Cart Cleanup] Failed: ${error.message}`,
        error.stack || '',
      );
    }
  }

  /**
   * Manual cleanup method for testing or administrative purposes
   */
  async manualCleanup() {
    try {
      const result = await this.cartService.cleanupExpiredAnonymousCarts();
      this.logger.log(`[Cart Cleanup - Manual] ${result.message}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[Cart Cleanup - Manual] Failed: ${error.message}`,
        error.stack || '',
      );
      throw error;
    }
  }
}
