import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../../prisma/prisma.service';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // Configure web-push with VAPID keys
    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const vapidSubject =
      this.configService.get<string>('VAPID_SUBJECT') ||
      'mailto:admin@revsticks.com';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
      this.logger.log('Web push configured with VAPID keys');
    } else {
      this.logger.warn(
        'VAPID keys not configured. Push notifications will not work. Run: npx web-push generate-vapid-keys',
      );
    }
  }

  /**
   * Subscribe a device to push notifications
   */
  async subscribe(userId: string, subscription: PushSubscription) {
    this.logger.log(
      `Attempting to subscribe user ${userId} to push notifications`,
    );
    this.logger.debug(
      `Subscription endpoint: ${subscription.endpoint.substring(0, 50)}...`,
    );

    try {
      // Validate subscription object
      if (
        !subscription?.endpoint ||
        !subscription?.keys?.p256dh ||
        !subscription?.keys?.auth
      ) {
        this.logger.error('Invalid subscription object received');
        throw new Error('Invalid subscription format');
      }

      // Store subscription in database
      const result = await this.prisma.push_subscription.upsert({
        where: {
          endpoint: subscription.endpoint,
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId: userId,
        },
        create: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userId: userId,
        },
      });

      this.logger.log(
        `Successfully saved subscription for user ${userId} (ID: ${result.id})`,
      );
      return { success: true, subscriptionId: result.id };
    } catch (error) {
      this.logger.error(
        `Failed to save subscription for user ${userId}: ${error.message}`,
      );
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Unsubscribe a device from push notifications
   */
  async unsubscribe(endpoint: string) {
    this.logger.log(
      `Attempting to unsubscribe endpoint: ${endpoint.substring(0, 50)}...`,
    );

    try {
      if (!endpoint) {
        this.logger.error('No endpoint provided for unsubscribe');
        throw new Error('Endpoint is required');
      }

      const deleted = await this.prisma.push_subscription.delete({
        where: { endpoint },
      });

      this.logger.log(
        `Successfully removed subscription for endpoint ${endpoint.substring(0, 50)}... (ID: ${deleted.id})`,
      );
      return { success: true, message: 'Subscription removed' };
    } catch (error) {
      if (error.code === 'P2025') {
        this.logger.warn(
          `Subscription not found for endpoint: ${endpoint.substring(0, 50)}...`,
        );
        return {
          success: true,
          message: 'Subscription not found (already removed)',
        };
      }

      this.logger.error(`Failed to remove subscription: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: any) {
    this.logger.log(`Sending notification to user ${userId}`);
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

    try {
      if (!userId) {
        this.logger.error('No userId provided for sendToUser');
        throw new Error('userId is required');
      }

      if (!payload) {
        this.logger.error('No payload provided for sendToUser');
        throw new Error('payload is required');
      }

      const subscriptions = await this.prisma.push_subscription.findMany({
        where: { userId },
      });

      this.logger.log(
        `Found ${subscriptions.length} subscription(s) for user ${userId}`,
      );

      if (subscriptions.length === 0) {
        this.logger.warn(`No subscriptions found for user ${userId}`);
        return {
          success: false,
          message: 'No subscriptions found',
          sent: 0,
          total: 0,
        };
      }

      const results = await Promise.allSettled(
        subscriptions.map((sub, index) => {
          this.logger.debug(
            `Sending to subscription ${index + 1}/${subscriptions.length} for user ${userId}`,
          );
          return this.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload,
          );
        }),
      );

      const successCount = results.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(
        `Notification results for user ${userId}: ${successCount} sent, ${failedCount} failed out of ${subscriptions.length} total`,
      );

      if (failedCount > 0) {
        const failedReasons = results
          .filter((r) => r.status === 'rejected')
          .map((r: any) => r.reason?.message || 'Unknown error');
        this.logger.warn(
          `Failed notifications for user ${userId}: ${failedReasons.join(', ')}`,
        );
      }

      return { success: true, sent: successCount, total: subscriptions.length };
    } catch (error) {
      this.logger.error(
        `Failed to send notifications to user ${userId}: ${error.message}`,
      );
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Send push notification to all admin users
   */
  async sendToAdmins(payload: any) {
    this.logger.log('Sending notification to all admin users');
    this.logger.debug(`Payload: ${JSON.stringify(payload)}`);

    try {
      if (!payload) {
        this.logger.error('No payload provided for sendToAdmins');
        throw new Error('payload is required');
      }

      // Get all admin users
      const adminUsers = await this.prisma.user.findMany({
        where: {
          role: 'admin',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      this.logger.log(`Found ${adminUsers.length} admin user(s)`);

      if (adminUsers.length === 0) {
        this.logger.warn('No admin users found in database');
        return {
          success: false,
          message: 'No admin users found',
          sent: 0,
          total: 0,
        };
      }

      // Get all subscriptions for admin users
      const subscriptions = await this.prisma.push_subscription.findMany({
        where: {
          userId: {
            in: adminUsers.map((u) => u.id),
          },
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      this.logger.log(
        `Found ${subscriptions.length} push subscription(s) for ${adminUsers.length} admin user(s)`,
      );

      if (subscriptions.length === 0) {
        this.logger.warn('No push subscriptions found for admin users');
        return {
          success: false,
          message: 'No admin subscriptions found',
          sent: 0,
          total: 0,
        };
      }

      const results = await Promise.allSettled(
        subscriptions.map((sub, index) => {
          this.logger.debug(
            `Sending to admin subscription ${index + 1}/${subscriptions.length} (User: ${sub.user.email})`,
          );
          return this.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload,
          );
        }),
      );

      const successCount = results.filter(
        (r) => r.status === 'fulfilled',
      ).length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(
        `Admin notification results: ${successCount} sent, ${failedCount} failed out of ${subscriptions.length} total`,
      );

      if (failedCount > 0) {
        const failedReasons = results
          .filter((r) => r.status === 'rejected')
          .map((r: any) => r.reason?.message || 'Unknown error');
        this.logger.warn(
          `Failed admin notifications: ${failedReasons.join(', ')}`,
        );
      }

      return { success: true, sent: successCount, total: subscriptions.length };
    } catch (error) {
      this.logger.error(
        `Failed to send notifications to admins: ${error.message}`,
      );
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Send a push notification to a specific subscription
   */
  private async sendNotification(subscription: PushSubscription, payload: any) {
    const endpointPreview = subscription.endpoint.substring(0, 50);
    this.logger.debug(
      `Sending notification to endpoint: ${endpointPreview}...`,
    );

    try {
      if (
        !subscription?.endpoint ||
        !subscription?.keys?.p256dh ||
        !subscription?.keys?.auth
      ) {
        this.logger.error('Invalid subscription format in sendNotification');
        throw new Error('Invalid subscription format');
      }

      const payloadString = JSON.stringify(payload);
      this.logger.debug(
        `Notification payload size: ${payloadString.length} bytes`,
      );

      await webpush.sendNotification(subscription, payloadString);

      this.logger.log(
        `✓ Notification successfully sent to ${endpointPreview}...`,
      );
    } catch (error) {
      this.logger.error(
        `✗ Failed to send notification to ${endpointPreview}...: ${error.message}`,
      );

      // Log additional error details if available
      if (error.statusCode) {
        this.logger.error(`HTTP Status Code: ${error.statusCode}`);
      }
      if (error.body) {
        this.logger.error(`Response body: ${error.body}`);
      }

      // If subscription is invalid, remove it from database
      if (error.statusCode === 404 || error.statusCode === 410) {
        this.logger.warn(
          `Subscription expired or invalid (${error.statusCode}), removing from database: ${endpointPreview}...`,
        );

        try {
          await this.prisma.push_subscription.delete({
            where: { endpoint: subscription.endpoint },
          });
          this.logger.log(
            `Successfully removed invalid subscription from database`,
          );
        } catch (deleteError) {
          this.logger.warn(
            `Failed to remove invalid subscription: ${deleteError.message}`,
          );
          // Ignore errors if already deleted
        }
      }

      throw error;
    }
  }

  /**
   * Generate VAPID keys (for initial setup)
   */
  generateVapidKeys() {
    return webpush.generateVAPIDKeys();
  }
}
