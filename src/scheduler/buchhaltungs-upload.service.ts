import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'prisma/prisma.service';
import { InvoiceService } from '../orders/invoice.service';
import { StripeService } from '../stripe/stripe.service';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data') as typeof import('form-data');

@Injectable()
export class BuchhaltungsUploadService implements OnModuleInit {
  private readonly logger = new Logger(BuchhaltungsUploadService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly invoiceService: InvoiceService,
    private readonly stripeService: StripeService,
  ) {}

  onModuleInit() {
    this.logger.log(
      '[Buchhaltung Upload] Service initialized – Checking for unsynced orders every hour',
    );
  }

  /**
   * Build a descriptive string of all items in the order
   */
  private buildArtikelDescription(order: {
    items?: {
      quantity: number;
      sticker?: { translations?: { title: string }[] } | null;
      customSticker?: { id: string } | null;
    }[];
    partItems?: {
      quantity: number;
      part?: { translations?: { title: string }[] } | null;
    }[];
    powdercoatItems?: {
      quantity: number;
      powdercoatingService?: { name: string } | null;
    }[];
  }): string {
    const items: string[] = [];

    // Add sticker items
    if (order.items) {
      for (const item of order.items) {
        let name = 'Sticker';
        if (item.sticker?.translations?.[0]?.title) {
          name = item.sticker.translations[0].title;
        } else if (item.customSticker) {
          name = 'Custom Sticker';
        }
        items.push(`${item.quantity}x ${name}`);
      }
    }

    // Add part items
    if (order.partItems) {
      for (const item of order.partItems) {
        const name = item.part?.translations?.[0]?.title || 'Part';
        items.push(`${item.quantity}x ${name}`);
      }
    }

    // Add powdercoat items
    if (order.powdercoatItems) {
      for (const item of order.powdercoatItems) {
        const name = item.powdercoatingService?.name || 'Powdercoating Service';
        items.push(`${item.quantity}x ${name}`);
      }
    }

    return items.length > 0 ? items.join(', ') : 'Revsticks Bestellung';
  }

  @Cron('0 * * * *')
  async checkAndUploadOrders() {
    if (this.isRunning) {
      this.logger.log(
        '[Buchhaltung Upload] Previous run still in progress – skipping this tick',
      );
      return;
    }
    this.isRunning = true;

    const bhEndpoint = this.configService.get<string>('BH_ENDPOINT');
    const bhUser = this.configService.get<string>('BH_USER');
    const bhPassword = this.configService.get<string>('BH_PASSWORD');
    const bhBusinessId = this.configService.get<string>('BH_BUSINESS_ID');

    if (!bhEndpoint || !bhUser || !bhPassword || !bhBusinessId) {
      this.logger.warn(
        '[Buchhaltung Upload] Missing BH_ENDPOINT / BH_USER / BH_PASSWORD / BH_BUSINESS_ID env vars – skipping',
      );
      this.isRunning = false;
      return;
    }

    let accessToken: string | null = null;

    try {
      // ── Step 1: Login ───────────────────────────────────────────────────────
      this.logger.log(
        `[Buchhaltung Upload] Logging in to ${bhEndpoint} as ${bhUser}`,
      );
      const loginResp = await axios.post(
        `${bhEndpoint}/auth/login`,
        { username: bhUser, password: bhPassword },
        { timeout: 10_000 },
      );
      accessToken = loginResp.data.accessToken as string;
      this.logger.log('[Buchhaltung Upload] Login successful');

      const cookieHeader = `accessToken=${accessToken}`;
      const authHeaders = { Cookie: cookieHeader };

      // ── Step 2: Fetch completed stripe orders ───────────────────────────────
      const orders = await this.prisma.sticker_order.findMany({
        where: {
          paymentMethod: 'stripe',
          paymentId: { not: null },
          status: { in: ['completed'] },
        },
        orderBy: { orderDate: 'asc' },
        include: {
          items: {
            include: {
              sticker: {
                include: {
                  translations: {
                    where: { language: 'de' },
                  },
                },
              },
              customSticker: true,
            },
          },
          partItems: {
            include: {
              part: {
                include: {
                  translations: {
                    where: { language: 'de' },
                  },
                },
              },
            },
          },
          powdercoatItems: {
            include: {
              powdercoatingService: true,
            },
          },
        },
      });

      this.logger.log(
        `[Buchhaltung Upload] Found ${orders.length} qualifying stripe order(s) to check`,
      );

      let uploadedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const order of orders) {
        try {
          // ── Step 2a: Check if already in Buchhaltung ───────────────────────
          this.logger.log(
            `[Buchhaltung Upload] Checking order ${order.id} (paymentId: ${order.paymentId}) …`,
          );

          const checkResp = await axios.get(`${bhEndpoint}/invoice/by-number`, {
            params: {
              number: order.paymentId,
              type: 'income',
              businessId: bhBusinessId,
            },
            headers: authHeaders,
            timeout: 10_000,
          });

          if (
            checkResp.data.results &&
            (checkResp.data.results as unknown[]).length > 0
          ) {
            this.logger.log(
              `[Buchhaltung Upload] Order ${order.id} already uploaded – skipping`,
            );
            skippedCount++;
            continue;
          }

          this.logger.log(
            `[Buchhaltung Upload] Order ${order.id} not yet uploaded – processing …`,
          );

          // ── Step 3: Generate invoice PDF via InvoiceService ────────────────
          let uploadedFileName = '';

          try {
            this.logger.log(
              `[Buchhaltung Upload] Generating invoice PDF for order ${order.id} …`,
            );
            const pdfBuffer = await this.invoiceService.generateInvoicePdf(
              order.id,
            );

            const form = new FormData();
            form.append('file', pdfBuffer, {
              filename: `invoice_${order.id}.pdf`,
              contentType: 'application/pdf',
            } as Parameters<InstanceType<typeof FormData>['append']>[2]);

            this.logger.log(
              `[Buchhaltung Upload] Uploading PDF to Buchhaltung for order ${order.id} …`,
            );
            const uploadResp = await axios.post<{
              success: boolean;
              fileName: string;
            }>(`${bhEndpoint}/upload-income`, form, {
              headers: {
                ...form.getHeaders(),
                Cookie: cookieHeader,
              },
              timeout: 30_000,
            });

            uploadedFileName = uploadResp.data.fileName;
            this.logger.log(
              `[Buchhaltung Upload] PDF stored as "${uploadedFileName}"`,
            );
          } catch (pdfErr) {
            this.logger.warn(
              `[Buchhaltung Upload] Could not generate/upload invoice PDF for order ${order.id}: ${(pdfErr as Error).message} – will save without file`,
            );
          }

          // ── Step 3b: Fetch Stripe fee ────────────────────────────────────
          let stripeFee: number | null = null;
          try {
            stripeFee = await this.stripeService.retrieveStripeFee(
              order.paymentId,
            );
            this.logger.log(
              `[Buchhaltung Upload] Stripe fee for order ${order.id}: ${stripeFee !== null ? `CHF ${stripeFee.toFixed(2)}` : 'unavailable'}`,
            );
          } catch (feeErr) {
            this.logger.warn(
              `[Buchhaltung Upload] Could not retrieve Stripe fee for order ${order.id}: ${(feeErr as Error).message}`,
            );
          }

          // ── Step 4: Save income record in Buchhaltung ──────────────────────
          const buyerName =
            `${order.firstName ?? ''} ${order.lastName ?? ''}`.trim() ||
            order.guestEmail ||
            order.email ||
            null;

          const totalPrice = order.totalPrice ? Number(order.totalPrice) : null;
          const shipmentCost = order.shipmentCost
            ? Number(order.shipmentCost)
            : 0;
          const netPrice =
            totalPrice !== null ? totalPrice - shipmentCost : null;

          if (uploadedFileName) {
            // Mode A flow: PDF was uploaded – use /save-income
            this.logger.log(
              `[Buchhaltung Upload] Saving income record (with PDF) for order ${order.id} …`,
            );
            const saveResp = await axios.post<{
              success: boolean;
              income: { id: string };
            }>(
              `${bhEndpoint}/save-income`,
              {
                businessId: bhBusinessId,
                fileName: uploadedFileName,
                zahlungsnummer: order.paymentId,
                datum: order.orderDate
                  ? new Date(order.orderDate).toISOString()
                  : null,
                artikel: this.buildArtikelDescription(order),
                kaeufer: buyerName,
                preis: netPrice,
                versandkosten: shipmentCost || null,
                gebuehren: stripeFee,
                bezahlt: true,
                total: totalPrice,
                zahlungsmethode: 'stripe',
              },
              {
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                timeout: 15_000,
              },
            );
            this.logger.log(
              `[Buchhaltung Upload] Order ${order.id} saved – Buchhaltung income id: ${saveResp.data.income?.id}`,
            );
          } else {
            // Mode B flow: no PDF available – direct JSON save via /upload-income
            this.logger.log(
              `[Buchhaltung Upload] Saving income record (no PDF) for order ${order.id} …`,
            );
            const saveResp = await axios.post<{
              success: boolean;
              income: { id: string };
            }>(
              `${bhEndpoint}/upload-income`,
              {
                businessId: bhBusinessId,
                fileName: '',
                zahlungsnummer: order.paymentId,
                datum: order.orderDate
                  ? new Date(order.orderDate).toISOString()
                  : null,
                artikel: this.buildArtikelDescription(order),
                kaeufer: buyerName,
                preis: netPrice,
                versandkosten: shipmentCost || null,
                gebuehren: stripeFee,
                bezahlt: true,
                total: totalPrice,
                zahlungsmethode: 'stripe',
              },
              {
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                timeout: 15_000,
              },
            );
            this.logger.log(
              `[Buchhaltung Upload] Order ${order.id} saved – Buchhaltung income id: ${saveResp.data.income?.id}`,
            );
          }

          uploadedCount++;
        } catch (orderErr) {
          errorCount++;
          this.logger.error(
            `[Buchhaltung Upload] Failed to process order ${order.id}: ${(orderErr as Error).message}`,
            (orderErr as Error).stack ?? '',
          );
        }
      }

      this.logger.log(
        `[Buchhaltung Upload] Run complete – uploaded: ${uploadedCount}, already synced: ${skippedCount}, errors: ${errorCount}`,
      );
    } catch (err) {
      this.logger.error(
        `[Buchhaltung Upload] Fatal error during run: ${(err as Error).message}`,
        (err as Error).stack ?? '',
      );
    } finally {
      // ── Step 5: Logout ──────────────────────────────────────────────────────
      if (accessToken) {
        try {
          await axios.post(
            `${bhEndpoint}/auth/logout`,
            {},
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              timeout: 10_000,
            },
          );
          this.logger.log('[Buchhaltung Upload] Logged out successfully');
        } catch (logoutErr) {
          this.logger.warn(
            `[Buchhaltung Upload] Logout failed (non-fatal): ${(logoutErr as Error).message}`,
          );
        }
      }
      this.isRunning = false;
    }
  }
}
