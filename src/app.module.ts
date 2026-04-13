import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestModule } from './test/test.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CsrfMiddleware } from './auth/middleware/csrf.middleware';
import { ThrottlerModule } from '@nestjs/throttler';
import { StickerOrderModule } from './orders/order.module';
import { StripeModule } from './stripe/stripe.module';
import { DiscountsModule } from './discounts/discount.module';
import { AvailableColorsModule } from './availableColors/availableColors.module';
import { GroupsModule } from './groups/groups.module';
import { PrismaService } from 'prisma/prisma.service';
import { VariationModule } from './variation/variation.module';
import { PartsModule } from './parts/parts.module';
import { TodaysChoiceModule } from './todaysChoice/todaysChoice.module';
import { LifeCheckModule } from './life-check/life-check.module';
import { TrackerModule } from './tracker/tracker.module';
import { CartModule } from './cart/cart.module';
import { MailModule } from './mail/mail.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { NotificationModule } from './notifications/notification.module';
import { FilamentTypesModule } from './filamentTypes/filamentTypes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 1000, // 1 second
        limit: 30, // 30 requests
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true, // Automatically load entities (optional)
      synchronize: process.env.NODE_ENV === 'development', // Only true in development
      migrationsRun: process.env.NODE_ENV !== 'development', // Run migrations in production
      migrations: ['dist/migrations/*.js'], // Where your migrations are stored
    }),
    TestModule,
    AuthModule,
    UsersModule,
    StickerOrderModule,
    StripeModule,
    DiscountsModule,
    AvailableColorsModule,
    GroupsModule,
    VariationModule,
    PartsModule,
    TodaysChoiceModule,
    LifeCheckModule,
    TrackerModule,
    CartModule,
    MailModule,
    SchedulerModule,
    NotificationModule,
    FilamentTypesModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      // .exclude(
      //   'auth/login', // Exclude login
      //   { path: 'users', method: RequestMethod.POST }, // Exclude registration
      // )
      .exclude(
        'tracker', // Exclude WebSocket paths
        'socket.io', // Also exclude Socket.IO paths
        'cart(.*)', // Exclude cart endpoints temporarily to test
        'auth/login', // Also exclude login for safety
        'orders/calculate-price', // Exclude calculate-price endpoint
      )
      .forRoutes('*');
  }
}
