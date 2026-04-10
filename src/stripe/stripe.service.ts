import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-02-25.clover',
    });
  }

  async createPaymentIntent(amount: number): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'chf',
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(id);
  }

  async retrieveInvoice(id: string): Promise<Stripe.Invoice> {
    return this.stripe.invoices.retrieve(id);
  }

  /**
   * Returns the Stripe processing fee (in CHF) for a given PaymentIntent ID,
   * or null if it cannot be determined.
   */
  async retrieveStripeFee(paymentIntentId: string): Promise<number | null> {
    const pi = await this.stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge.balance_transaction'],
    });

    const charge = (pi as unknown as Record<string, unknown>).latest_charge as
      | Record<string, unknown>
      | null
      | undefined;
    if (!charge) return null;

    const bt = charge.balance_transaction as
      | Record<string, unknown>
      | null
      | undefined;
    if (!bt || typeof bt.fee !== 'number') return null;

    // Stripe stores fees in the smallest currency unit (e.g. Rappen for CHF)
    return bt.fee / 100;
  }
}
