import { Logger, Module } from '@nestjs/common';
import { StickerOrderService } from './order.service';
import { StickerOrderController } from './order.controller';
import { InvoiceService } from './invoice.service';
import { DiscountsModule } from 'src/discounts/discount.module';
import { PartsModule } from 'src/parts/parts.module';
import { MailModule } from 'src/mail/mail.module';
import { NotificationModule } from 'src/notifications/notification.module';
import { PrismaService } from 'prisma/prisma.service';
import { MinioService } from 'src/storage/minio.service';
import { UpsService } from './ups.service';
import { PostService } from './post.service';

@Module({
  imports: [DiscountsModule, PartsModule, MailModule, NotificationModule],
  controllers: [StickerOrderController],
  providers: [
    StickerOrderService,
    InvoiceService,
    UpsService,
    PostService,
    PrismaService,
    MinioService,
    Logger,
  ],
  exports: [StickerOrderService],
})
export class StickerOrderModule {}
