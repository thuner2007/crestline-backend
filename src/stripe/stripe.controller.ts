import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

interface CreatePaymentIntentDto {
  amount: number;
}

@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
@Public()
@Controller('stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() { amount }: CreatePaymentIntentDto) {
    const paymentIntent = await this.stripeService.createPaymentIntent(amount);
    return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id };
  }

  @Public()
  @Get('verify-payment/:id')
  async verifyPayment(@Param('id') id: string) {
    const paymentIntent = await this.stripeService.retrievePaymentIntent(id);

    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert back from cents
      currency: paymentIntent.currency,
      paymentMethod: paymentIntent.payment_method,
      created: new Date(paymentIntent.created * 1000), // Convert timestamp to Date
    };
  }
}
