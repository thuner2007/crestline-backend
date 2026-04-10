import {
  Controller,
  Post,
  Delete,
  Body,
  Request,
  Get,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SubscribeDto, UnsubscribeDto } from './dto/notification.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/role.enum';

@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Post('subscribe')
  @Roles(UserRole.ADMIN)
  async subscribe(@Body() subscribeDto: SubscribeDto, @Request() req) {
    // Log the entire request for debugging
    this.logger.log('=== SUBSCRIBE REQUEST START ===');
    this.logger.log(`Method: POST /notifications/subscribe`);
    this.logger.log(`Headers: ${JSON.stringify(req.headers)}`);
    this.logger.log(`User object: ${JSON.stringify(req.user)}`);
    this.logger.log(`Body: ${JSON.stringify(subscribeDto)}`);

    const userId = req.user?.sub; // JWT uses 'sub' claim for user ID
    const userRole = req.user?.role;
    const userEmail = req.user?.username; // JWT uses 'username' not 'email'

    this.logger.log(
      `User details - ID: ${userId || 'none'}, Role: ${userRole || 'none'}, Email: ${userEmail || 'none'}`,
    );

    try {
      if (!userId) {
        this.logger.error('❌ Subscribe attempt without authenticated user');
        this.logger.error(`Request has user object: ${!!req.user}`);
        this.logger.error(`Request headers: ${JSON.stringify(req.headers)}`);
        this.logger.error(
          `Authorization header: ${req.headers?.authorization || 'MISSING'}`,
        );
        throw new HttpException(
          'Authentication required',
          HttpStatus.UNAUTHORIZED,
        );
      }

      this.logger.log(`✓ User authenticated: ${userId}`);

      if (!subscribeDto || !subscribeDto.endpoint) {
        this.logger.error(
          `❌ Invalid subscription data received from user ${userId}`,
        );
        this.logger.error(`Subscription data: ${JSON.stringify(subscribeDto)}`);
        throw new HttpException(
          'Invalid subscription data',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(`✓ Subscription data valid`);
      this.logger.debug(
        `Subscription endpoint: ${subscribeDto.endpoint.substring(0, 50)}...`,
      );

      const result = await this.notificationService.subscribe(
        userId,
        subscribeDto,
      );

      this.logger.log(`✅ Successfully subscribed user ${userId}`);
      this.logger.log('=== SUBSCRIBE REQUEST END (SUCCESS) ===');
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Failed to subscribe user ${userId}: ${error.message}`,
      );
      this.logger.error(`Error stack: ${error.stack}`);
      this.logger.error('=== SUBSCRIBE REQUEST END (ERROR) ===');

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to subscribe: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('unsubscribe')
  @Roles(UserRole.ADMIN)
  async unsubscribe(@Body() unsubscribeDto: UnsubscribeDto, @Request() req) {
    this.logger.log('=== UNSUBSCRIBE REQUEST START ===');
    this.logger.log(`Method: DELETE /notifications/unsubscribe`);
    this.logger.log(`User: ${req.user?.id || 'none'}`);
    this.logger.log(`Body: ${JSON.stringify(unsubscribeDto)}`);

    try {
      if (!unsubscribeDto || !unsubscribeDto.endpoint) {
        this.logger.error('❌ Unsubscribe attempt without endpoint');
        throw new HttpException('Endpoint is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`✓ Endpoint provided`);
      this.logger.debug(
        `Unsubscribe endpoint: ${unsubscribeDto.endpoint.substring(0, 50)}...`,
      );

      const result = await this.notificationService.unsubscribe(
        unsubscribeDto.endpoint,
      );

      this.logger.log(
        `✅ Successfully unsubscribed endpoint: ${unsubscribeDto.endpoint.substring(0, 50)}...`,
      );
      this.logger.log('=== UNSUBSCRIBE REQUEST END (SUCCESS) ===');
      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to unsubscribe: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      this.logger.error('=== UNSUBSCRIBE REQUEST END (ERROR) ===');

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to unsubscribe: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('vapid-public-key')
  @Roles(UserRole.ADMIN)
  getVapidPublicKey(@Request() req) {
    this.logger.log('=== VAPID PUBLIC KEY REQUEST START ===');
    this.logger.log(`Method: GET /notifications/vapid-public-key`);
    this.logger.log(`User: ${req.user?.id || 'none'}`);

    try {
      const publicKey = process.env.VAPID_PUBLIC_KEY;

      if (!publicKey) {
        this.logger.error('❌ VAPID_PUBLIC_KEY not configured in environment');
        throw new HttpException(
          'Push notifications not configured',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      this.logger.log(`✓ VAPID key found`);
      this.logger.debug(
        `Returning VAPID public key: ${publicKey.substring(0, 20)}...`,
      );
      this.logger.log('=== VAPID PUBLIC KEY REQUEST END (SUCCESS) ===');
      return { publicKey };
    } catch (error) {
      this.logger.error(`❌ Failed to get VAPID key: ${error.message}`);
      this.logger.error('=== VAPID PUBLIC KEY REQUEST END (ERROR) ===');

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to get VAPID key',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test')
  @Roles(UserRole.ADMIN)
  async testNotification(@Request() req) {
    this.logger.log('=== TEST NOTIFICATION REQUEST START ===');
    this.logger.log(`Method: POST /notifications/test`);

    const userId = req.user?.sub; // JWT uses 'sub' claim for user ID
    const userRole = req.user?.role;

    this.logger.log(`User: ${userId || 'none'}, Role: ${userRole || 'none'}`);

    try {
      if (!userId) {
        this.logger.error(
          '❌ Test notification attempt without authenticated user',
        );
        throw new HttpException(
          'Authentication required',
          HttpStatus.UNAUTHORIZED,
        );
      }

      this.logger.log(`✓ User authenticated for test notification`);

      const result = await this.notificationService.sendToUser(userId, {
        title: 'Test Notification',
        body: 'This is a test notification from RevSticks',
        icon: '/icon.png',
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Test notification result for user ${userId}: ${result.sent}/${result.total} sent`,
      );

      if (result.sent === 0) {
        this.logger.warn(
          `⚠️ No notifications were sent to user ${userId}. User may not have any active subscriptions.`,
        );
        this.logger.log(
          '=== TEST NOTIFICATION REQUEST END (NO SUBSCRIPTIONS) ===',
        );
        return {
          ...result,
          message:
            'No active subscriptions found. Please subscribe to push notifications first.',
        };
      }

      this.logger.log('=== TEST NOTIFICATION REQUEST END (SUCCESS) ===');
      return result;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send test notification to user ${userId}: ${error.message}`,
      );
      this.logger.error(`Error stack: ${error.stack}`);
      this.logger.error('=== TEST NOTIFICATION REQUEST END (ERROR) ===');

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to send test notification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
