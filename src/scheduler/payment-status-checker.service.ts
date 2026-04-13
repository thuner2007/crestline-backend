import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentStatusCheckerService implements OnModuleInit {
  private readonly logger = new Logger(PaymentStatusCheckerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly mailService: MailService,
  ) {}

  onModuleInit() {
    this.logger.log(
      '[Payment Status Check] Service initialized - Running every minute to check pending payment statuses',
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkPendingPayments() {
    try {
      const pendingOrders = await this.prisma.sticker_order.findMany({
        where: {
          status: 'stand',
          paymentId: {
            not: null,
          },
        },
      });

      const results = {
        checked: pendingOrders.length,
        succeeded: 0,
        requiresAction: 0,
        failed: 0,
        canceled: 0,
        other: 0,
        errors: 0,
      };

      for (const order of pendingOrders) {
        try {
          const paymentIntent = await this.stripeService.retrievePaymentIntent(
            order.paymentId,
          );

          if (paymentIntent.status === 'succeeded') {
            results.succeeded++;
            const updatedOrder = await this.prisma.sticker_order.update({
              where: { id: order.id },
              data: {
                status: 'pending',
              },
              include: {
                items: {
                  include: {
                    sticker: {
                      include: {
                        translations: true,
                      },
                    },
                  },
                },
                partItems: {
                  include: {
                    part: {
                      include: {
                        translations: true,
                      },
                    },
                  },
                },
              },
            });

            try {
              const customerEmail =
                updatedOrder.email || updatedOrder.guestEmail;
              if (customerEmail) {
                await this.mailService.sendOrderConfirmationEmail({
                  email: customerEmail,
                  firstName: updatedOrder.firstName,
                  lastName: updatedOrder.lastName,
                  orderId: updatedOrder.id,
                  totalPrice: updatedOrder.totalPrice?.toNumber() || 0,
                  orderItems: updatedOrder.items.map((item) => ({
                    quantity: item.quantity,
                    width: item.width?.toNumber(),
                    height: item.height?.toNumber(),
                    vinyl: item.vinyl,
                    printed: item.printed,
                    stickerId: item.stickerId,
                    stickerName:
                      item.sticker?.translations?.find(
                        (t) => t.language === 'de',
                      )?.title ||
                      item.sticker?.translations?.[0]?.title ||
                      undefined,
                    stickerImages: item.sticker?.images || [],
                    customizationOptions:
                      typeof item.customizationOptions === 'string'
                        ? JSON.parse(item.customizationOptions)
                        : item.customizationOptions,
                  })),
                  partOrderItems: updatedOrder.partItems.map((item) => ({
                    quantity: item.quantity,
                    partId: item.partId,
                    partName:
                      item.part?.translations?.find((t) => t.language === 'de')
                        ?.title ||
                      item.part?.translations?.[0]?.title ||
                      `Teil ${item.partId}`,
                    partImages: item.part?.images || [],
                    customizationOptions:
                      typeof item.customizationOptions === 'string'
                        ? JSON.parse(item.customizationOptions)
                        : item.customizationOptions,
                  })),
                });
              }
            } catch {
              // Don't throw error here - payment success should not fail because of email issues
            }
          } else if (paymentIntent.status === 'requires_action') {
            results.requiresAction++;
          } else if (paymentIntent.status === 'requires_payment_method') {
            results.failed++;
          } else if (paymentIntent.status === 'canceled') {
            results.canceled++;
          } else {
            results.other++;
          }
        } catch {
          results.errors++;
        }
      }

      this.logger.log(
        `[Payment Status Check] Checked ${results.checked} orders: ` +
          `${results.succeeded} succeeded, ${results.requiresAction} require action, ` +
          `${results.failed} failed, ${results.canceled} canceled, ` +
          `${results.other} other status, ${results.errors} errors`,
      );
    } catch (error) {
      this.logger.error(
        `[Payment Status Check] Critical error: ${error.message}`,
        error.stack || '',
      );
    }
  }
}
