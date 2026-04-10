import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class EmailValidationCleanupService implements OnModuleInit {
  private readonly logger = new Logger(EmailValidationCleanupService.name);

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.logger.log(
      '[Email Validation Cleanup] Service initialized - Running every hour to cleanup expired email validations (1h+ old)',
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredEmailValidations() {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const deleteResult = await this.prisma.email_validation.deleteMany({
        where: {
          createdAt: {
            lt: oneHourAgo,
          },
        },
      });

      this.logger.log(
        `[Email Validation Cleanup] Deleted ${deleteResult.count} expired records`,
      );
    } catch (error) {
      this.logger.error(
        `[Email Validation Cleanup] Failed: ${error.message}`,
        error.stack || '',
      );
    }
  }

  // Optional: Manual cleanup method for testing or administrative purposes
  async manualCleanup(): Promise<number> {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const deleteResult = await this.prisma.email_validation.deleteMany({
        where: {
          createdAt: {
            lt: oneHourAgo,
          },
        },
      });

      this.logger.log(
        `[Email Validation Cleanup - Manual] Deleted ${deleteResult.count} expired records`,
      );

      return deleteResult.count;
    } catch (error) {
      this.logger.error(
        `[Email Validation Cleanup - Manual] Failed: ${error.message}`,
        error.stack || '',
      );
      throw error;
    }
  }

  // Optional: Get count of expired validations without deleting
  async getExpiredValidationCount(): Promise<number> {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    return this.prisma.email_validation.count({
      where: {
        createdAt: {
          lt: oneHourAgo,
        },
      },
    });
  }
}
