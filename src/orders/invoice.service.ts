import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInvoicePdf(orderId: string): Promise<Buffer> {
    const order = await this.prisma.sticker_order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            sticker: {
              include: { translations: true },
            },
            customSticker: true,
          },
        },
        partItems: {
          include: {
            part: {
              include: { translations: true },
            },
          },
        },
        discount: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Parse customizationOptions JSON strings
    const items = order.items.map((item) => ({
      ...item,
      customizationOptions: (typeof item.customizationOptions === 'string'
        ? JSON.parse(item.customizationOptions as string)
        : item.customizationOptions) as Array<{ type: string; value: string }>,
    }));

    const partItems = order.partItems.map((item) => ({
      ...item,
      customizationOptions: (typeof item.customizationOptions === 'string'
        ? JSON.parse(item.customizationOptions as string)
        : item.customizationOptions) as Array<{ type: string; value: string }>,
    }));

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // All jsPDF coordinates were in mm; pdfkit uses points (1mm = 2.8346pt).
      // A4 = 595.28 x 841.89 pt  (same as 210 x 297 mm)
      const pt = (mm: number) => mm * 2.8346;
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = pt(20);
      let yPos = margin;

      // Tracks whether we need a new page
      const checkNewPage = (requiredSpacePt: number) => {
        if (yPos + requiredSpacePt > pageHeight - 30) {
          doc.addPage({ size: 'A4', margin: 0 });
          yPos = margin;
          return true;
        }
        return false;
      };

      // Right-aligned text: rightEdgePt is the right boundary in pdfkit points.
      // Mirrors jsPDF's doc.text(t, rightEdge, y, { align: 'right' }) pattern.
      const rightAlignText = (
        text: string,
        rightEdgePt: number,
        y: number,
        opts: Record<string, unknown> = {},
      ) => {
        doc.text(text, margin, y, {
          ...opts,
          align: 'right',
          width: rightEdgePt - margin,
          lineBreak: false,
        });
      };

      // ===== HEADER SECTION =====

      // Company name (purple)
      doc.fontSize(24).font('Helvetica-Bold').fillColor([106, 27, 154]);
      doc.text('RevSticks', margin, yPos, { lineBreak: false });

      // "INVOICE" title right-aligned
      doc.fontSize(28).fillColor([0, 0, 0]);
      rightAlignText('INVOICE', pageWidth - margin, yPos);
      yPos += pt(10);

      // Company details (left column)
      doc.fontSize(9).font('Helvetica').fillColor([60, 60, 60]);
      doc.text('RevSticks', margin, yPos, { lineBreak: false });
      yPos += pt(4);
      doc.text('Pfarrhausweg 27', margin, yPos, { lineBreak: false });
      yPos += pt(4);
      doc.text('3604 Thun', margin, yPos, { lineBreak: false });
      yPos += pt(4);
      doc.text('Switzerland', margin, yPos, { lineBreak: false });
      yPos += pt(4);
      doc.text('Email: info@revsticks.com', margin, yPos, { lineBreak: false });
      yPos += pt(4);
      doc.text('Web: www.revsticks.com', margin, yPos, { lineBreak: false });

      // Invoice details (right column)
      // jsPDF: rightColX = pageWidth(210mm) - margin(20mm) - 60 = 130mm
      const rightColX = pt(130);
      const rightColValueX = rightColX + pt(25); // = pt(155)
      let rightYPos = margin + pt(10);

      doc.fontSize(9).font('Helvetica-Bold').fillColor([0, 0, 0]);
      doc.text('Invoice No:', rightColX, rightYPos, { lineBreak: false });
      doc.font('Helvetica');
      doc.text(
        `INV-${order.id.substring(0, 8).toUpperCase()}`,
        rightColValueX,
        rightYPos,
        { lineBreak: false },
      );
      rightYPos += pt(5);

      doc.font('Helvetica-Bold');
      doc.text('Date:', rightColX, rightYPos, { lineBreak: false });
      doc.font('Helvetica');
      doc.text(
        new Date(order.orderDate).toLocaleDateString('de-CH'),
        rightColValueX,
        rightYPos,
        { lineBreak: false },
      );
      rightYPos += pt(5);

      doc.font('Helvetica-Bold');
      doc.text('Order ID:', rightColX, rightYPos, { lineBreak: false });
      doc.font('Helvetica');
      doc.text(order.id.substring(0, 12), rightColValueX, rightYPos, {
        lineBreak: false,
      });
      rightYPos += pt(5);

      doc.font('Helvetica-Bold');
      doc.text('Payment:', rightColX, rightYPos, { lineBreak: false });
      doc.font('Helvetica');
      doc.text(order.paymentMethod.toUpperCase(), rightColValueX, rightYPos, {
        lineBreak: false,
      });
      rightYPos += pt(5);

      if (order.paymentId) {
        doc.font('Helvetica-Bold');
        doc.text('Stripe ID:', rightColX, rightYPos, { lineBreak: false });
        doc.font('Helvetica');
        doc.text(order.paymentId, rightColValueX, rightYPos, {
          lineBreak: false,
          width: pt(50),
        });
      }

      yPos += pt(13);

      // Separator line
      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .strokeColor([200, 200, 200])
        .stroke();
      yPos += pt(10);

      // ===== CUSTOMER SECTION =====
      doc.fontSize(11).font('Helvetica-Bold').fillColor([0, 0, 0]);
      doc.text('Bill To:', margin, yPos, { lineBreak: false });
      yPos += pt(6);

      doc.fontSize(10).font('Helvetica');
      doc.text(
        `${order.firstName || ''} ${order.lastName || ''}`.trim(),
        margin,
        yPos,
        { lineBreak: false },
      );
      yPos += pt(5);
      doc.text(
        `${order.street || ''} ${order.houseNumber || ''}`.trim(),
        margin,
        yPos,
        { lineBreak: false },
      );
      yPos += pt(5);
      doc.text(
        `${order.zipCode || ''} ${order.city || ''}`.trim(),
        margin,
        yPos,
        { lineBreak: false },
      );
      yPos += pt(5);
      doc.text(order.country || '', margin, yPos, { lineBreak: false });
      yPos += pt(5);

      if (order.additionalAddressInfo) {
        doc.fontSize(9).fillColor([80, 80, 80]);
        doc.text(order.additionalAddressInfo, margin, yPos, {
          lineBreak: false,
        });
        yPos += pt(5);
        doc.fillColor([0, 0, 0]);
      }

      doc.fontSize(9);
      doc.text(`Email: ${order.email || ''}`, margin, yPos, {
        lineBreak: false,
      });
      yPos += pt(4);
      doc.text(`Phone: ${order.phone || ''}`, margin, yPos, {
        lineBreak: false,
      });
      yPos += pt(10);

      // ===== ITEMS TABLE =====
      checkNewPage(pt(40));

      // Table header bar (purple)
      doc
        .rect(margin, yPos, pageWidth - 2 * margin, pt(8))
        .fill([106, 27, 154]);

      doc.fontSize(9).font('Helvetica-Bold').fillColor([255, 255, 255]);
      doc.text('Item', margin + 2, yPos + pt(2.5), { lineBreak: false });

      // Column headers (right-aligned to their respective right edges, same as jsPDF):
      //   Qty       → right edge at 130mm = pt(130)
      //   Unit Price → right edge at 150mm = pt(150)
      //   Total      → right edge at 188mm = pt(188)
      rightAlignText('Qty', pt(130), yPos + pt(2.5));
      rightAlignText('Unit Price', pt(150), yPos + pt(2.5));
      rightAlignText('Total', pt(188), yPos + pt(2.5));
      yPos += pt(15);

      doc.fillColor([0, 0, 0]).font('Helvetica');

      let itemNumber = 1;
      let subtotalBeforeDiscount = 0;

      // --- Sticker items ---
      // Price note: sticker pricing is complex (size, vinyl, options).
      // The frontend used a simplified basePrice=10/unit. We do the same here;
      // the final TOTAL line always shows the actual order.totalPrice.
      items.forEach((item) => {
        checkNewPage(pt(25));

        const itemTitle =
          (item.sticker as any)?.translations?.[0]?.title ||
          (item.customSticker as any)?.name ||
          'Custom Sticker';
        const itemDesc = `${item.width}x${item.height}cm, ${item.vinyl ? 'Vinyl' : 'Printable'}`;
        const unitPrice = 10;
        const itemPrice = unitPrice * item.quantity;

        doc.font('Helvetica-Bold').fontSize(9).fillColor([0, 0, 0]);
        doc.text(`${itemNumber}. ${itemTitle}`, margin + 2, yPos, {
          lineBreak: false,
        });
        yPos += pt(4);

        doc.font('Helvetica').fontSize(8).fillColor([80, 80, 80]);
        doc.text(itemDesc, margin + 5, yPos, { lineBreak: false });

        const customOpts = item.customizationOptions || [];
        if (customOpts.length > 0) {
          const customText = customOpts
            .map((opt) => `${opt.type}: ${opt.value}`)
            .join(', ');
          yPos += pt(3.5);
          doc.text(customText, margin + 5, yPos, {
            lineBreak: false,
            width: pt(110),
          });
        }

        doc.fillColor([0, 0, 0]).fontSize(9);
        const priceY = yPos - (customOpts.length > 0 ? pt(3.5) : 0);
        rightAlignText(item.quantity.toString(), pt(130), priceY);
        rightAlignText(`CHF ${unitPrice.toFixed(2)}`, pt(150), priceY);
        rightAlignText(`CHF ${itemPrice.toFixed(2)}`, pt(188), priceY);

        subtotalBeforeDiscount += itemPrice;
        yPos += pt(8);
        itemNumber++;
      });

      // --- Part items ---
      partItems.forEach((item) => {
        checkNewPage(pt(25));

        const itemTitle =
          (item.part as any)?.translations?.[0]?.title || 'Part Item';
        const unitPrice = parseFloat(
          (item.part as any)?.price?.toString() || '0',
        );
        const itemPrice = unitPrice * item.quantity;

        doc.font('Helvetica-Bold').fontSize(9).fillColor([0, 0, 0]);
        doc.text(`${itemNumber}. ${itemTitle}`, margin + 2, yPos, {
          lineBreak: false,
        });
        yPos += pt(4);

        doc.font('Helvetica').fontSize(8).fillColor([80, 80, 80]);
        const customOpts = item.customizationOptions || [];
        if (customOpts.length > 0) {
          const customText = customOpts
            .map((opt) => `${opt.type}: ${opt.value}`)
            .join(', ');
          doc.text(customText, margin + 5, yPos, {
            lineBreak: false,
            width: pt(110),
          });
          yPos += pt(3.5);
        }

        doc.fillColor([0, 0, 0]).fontSize(9);
        const priceY = yPos - (customOpts.length > 0 ? pt(3.5) : 0);
        rightAlignText(item.quantity.toString(), pt(130), priceY);
        rightAlignText(`CHF ${unitPrice.toFixed(2)}`, pt(150), priceY);
        rightAlignText(`CHF ${itemPrice.toFixed(2)}`, pt(188), priceY);

        subtotalBeforeDiscount += itemPrice;
        yPos += pt(8);
        itemNumber++;
      });

      // ===== TOTALS SECTION =====
      checkNewPage(pt(50));
      yPos += pt(5);

      doc
        .moveTo(margin, yPos)
        .lineTo(pageWidth - margin, yPos)
        .strokeColor([200, 200, 200])
        .stroke();
      yPos += pt(8);

      // jsPDF labelX = pageWidth - margin - 60 = 130mm
      // jsPDF rightAlign = pageWidth - margin - 2 = 188mm
      const labelX = pt(130);
      const rightEdge = pt(188);

      doc.fontSize(10).font('Helvetica').fillColor([0, 0, 0]);
      doc.text('Subtotal:', labelX, yPos, { lineBreak: false });
      rightAlignText(
        `CHF ${subtotalBeforeDiscount.toFixed(2)}`,
        rightEdge,
        yPos,
      );
      yPos += pt(6);

      const shippingCost = parseFloat(order.shipmentCost?.toString() || '0');
      doc.text('Shipping:', labelX, yPos, { lineBreak: false });
      rightAlignText(`CHF ${shippingCost.toFixed(2)}`, rightEdge, yPos);
      yPos += pt(6);

      // Discount (uses the actual joined discount entity)
      if (order.discount) {
        const discountValue = parseFloat(order.discount.value.toString());
        let discountAmount = 0;

        if (order.discount.type === 'percentage') {
          discountAmount =
            (subtotalBeforeDiscount + shippingCost) * (discountValue / 100);
        } else {
          discountAmount = discountValue;
        }

        doc.text(`Discount (${order.discount.code}):`, labelX, yPos, {
          lineBreak: false,
        });
        rightAlignText(`-CHF ${discountAmount.toFixed(2)}`, rightEdge, yPos);
        yPos += pt(6);
      }

      // Total (highlighted row) — add extra gap so the rect doesn't bleed over shipping
      yPos += pt(4);
      const total = parseFloat(order.totalPrice.toString());
      const highlightX = labelX - pt(5);
      const highlightW = pageWidth - margin - labelX + pt(5);
      doc
        .rect(highlightX, yPos - pt(2), highlightW, pt(12))
        .fill([240, 240, 240]);

      doc.font('Helvetica-Bold').fontSize(12).fillColor([0, 0, 0]);
      doc.text('TOTAL:', labelX, yPos + pt(2), { lineBreak: false });
      rightAlignText(`CHF ${total.toFixed(2)}`, rightEdge, yPos + pt(2));
      yPos += pt(15);

      // ===== FOOTER CONTENT =====
      checkNewPage(pt(40));

      doc.fontSize(9).font('Helvetica-Bold').fillColor([0, 0, 0]);
      doc.text('Payment Information:', margin, yPos, { lineBreak: false });
      yPos += pt(5);

      doc.font('Helvetica').fontSize(8);
      doc.text(
        'Payment Method: ' + order.paymentMethod.toUpperCase(),
        margin,
        yPos,
        {
          lineBreak: false,
        },
      );
      yPos += pt(4);

      if (order.paymentId) {
        doc.text('Stripe Payment ID: ' + order.paymentId, margin, yPos, {
          lineBreak: false,
        });
        yPos += pt(4);
      }

      doc.text('Payment Status: PAID', margin, yPos, { lineBreak: false });
      yPos += pt(10);

      doc.font('Helvetica-Bold').fontSize(9).fillColor([0, 0, 0]);
      doc.text('Terms & Conditions:', margin, yPos, { lineBreak: false });
      yPos += pt(4);

      doc.font('Helvetica').fontSize(7).fillColor([80, 80, 80]);
      const terms = [
        'All prices are in Swiss Francs (CHF).',
        'Please reference the invoice number on all payments.',
        'For questions about this invoice, contact us at info@revsticks.com',
      ];
      terms.forEach((term) => {
        doc.text(term, margin, yPos, { lineBreak: false });
        yPos += pt(3.5);
      });

      yPos += pt(2);
      doc.fillColor([106, 27, 154]).font('Helvetica').fontSize(7);
      doc.text('Full Terms & Conditions: www.revsticks.ch/agb', margin, yPos, {
        link: 'https://www.revsticks.ch/agb',
        width: pageWidth - 2 * margin,
      });
      doc.fillColor([80, 80, 80]);
      yPos += pt(5);

      // Customer comment
      if (order.comment) {
        yPos += pt(5);
        checkNewPage(pt(20));
        doc.fontSize(8).font('Helvetica-Bold').fillColor([0, 0, 0]);
        doc.text('Customer Note:', margin, yPos, { lineBreak: false });
        yPos += pt(4);

        doc.font('Helvetica').fillColor([80, 80, 80]);
        const commentWidth = pageWidth - 2 * margin;
        const commentHeight = doc.heightOfString(order.comment, {
          width: commentWidth,
        });
        doc.text(order.comment, margin, yPos, {
          width: commentWidth,
          lineBreak: true,
        });
        yPos += commentHeight;
      }

      // ===== FOOTER BAR =====
      const footerY = pageHeight - 20;
      doc.rect(0, footerY, pageWidth, 20).fill([106, 27, 154]);

      doc.fontSize(7).fillColor([255, 255, 255]).font('Helvetica');
      doc.text(
        'Walker Growth Hub | info@revsticks.com | www.revsticks.com',
        margin,
        footerY + 10,
        {
          align: 'center',
          width: pageWidth - 2 * margin,
          lineBreak: false,
        },
      );

      // Reset pdfkit's internal y cursor to within page bounds.
      // The footer texts draw near the very bottom (~834pt on an 842pt page),
      // leaving doc.y > pageHeight after rendering, which causes pdfkit to
      // queue a blank trailing page before doc.end() finalises.
      doc.y = pageHeight - 5;

      doc.end();
    });
  }
}
