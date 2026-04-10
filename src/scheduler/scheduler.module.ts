import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailValidationCleanupService } from './email-validation-cleanup.service';
import { PaymentStatusCheckerService } from './payment-status-checker.service';
import { CartCleanupService } from './cart-cleanup.service';
import { IncompleteOrderCleanupService } from './incomplete-order-cleanup.service';
import { BuchhaltungsUploadService } from './buchhaltungs-upload.service';
import { PrismaService } from 'prisma/prisma.service';
import { StripeModule } from '../stripe/stripe.module';
import { MailModule } from '../mail/mail.module';
import { CartModule } from '../cart/cart.module';
import { InvoiceService } from '../orders/invoice.service';

@Module({
  imports: [ScheduleModule.forRoot(), StripeModule, MailModule, CartModule],
  providers: [
    EmailValidationCleanupService,
    PaymentStatusCheckerService,
    CartCleanupService,
    IncompleteOrderCleanupService,
    BuchhaltungsUploadService,
    PrismaService,
    InvoiceService,
  ],
  exports: [
    EmailValidationCleanupService,
    PaymentStatusCheckerService,
    CartCleanupService,
    IncompleteOrderCleanupService,
    BuchhaltungsUploadService,
  ],
})
export class SchedulerModule {}
