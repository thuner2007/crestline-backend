import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateDiscountDto } from './dto/discount.dto';
import { discount as PrismaDiscount, discount_type_enum } from '@prisma/client';

@Injectable()
export class DiscountService {
  constructor(private prisma: PrismaService) {}

  async create(createDiscountDto: CreateDiscountDto): Promise<PrismaDiscount> {
    try {
      return await this.prisma.discount.create({
        data: createDiscountDto,
      });
    } catch (error) {
      if (
        error instanceof Object &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Discount code already exists');
      }
      throw error;
    }
  }

  async findAll(includeInactive = false): Promise<PrismaDiscount[]> {
    return this.prisma.discount.findMany({
      where: includeInactive ? undefined : { active: true },
    });
  }

  async findOne(id: string): Promise<PrismaDiscount> {
    const discount = await this.prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    return discount;
  }

  async update(
    id: string,
    updateDiscountDto: Partial<CreateDiscountDto>,
  ): Promise<PrismaDiscount> {
    // Check if discount exists
    await this.findOne(id);

    try {
      return await this.prisma.discount.update({
        where: { id },
        data: updateDiscountDto,
      });
    } catch (error) {
      if (
        error instanceof Object &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Discount code already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const discount = await this.findOne(id);

    // Check if discount has been used
    if (discount.usageCount > 0) {
      // Instead of deleting, deactivate it
      await this.prisma.discount.update({
        where: { id },
        data: { active: false },
      });
    } else {
      // If never used, safely delete it
      await this.prisma.discount.delete({
        where: { id },
      });
    }
  }

  async validateCode(
    code: string,
    incrementUsage = false,
  ): Promise<{ type: discount_type_enum; value: number; id: string }> {
    const discount = await this.prisma.discount.findFirst({
      where: { code, active: true },
    });

    if (!discount) {
      throw new NotFoundException('Invalid discount code');
    }

    const now = new Date();

    // Check if discount is within valid date range
    if (discount.validFrom && discount.validFrom.getTime() > now.getTime()) {
      throw new BadRequestException('Discount code not yet valid');
    }

    if (discount.validUntil && discount.validUntil.getTime() < now.getTime()) {
      throw new BadRequestException('Discount code has expired');
    }

    // Check usage limits
    if (discount.maxUsage && discount.usageCount >= discount.maxUsage) {
      // Deactivate if max usage reached
      await this.prisma.discount.update({
        where: { id: discount.id },
        data: { active: false },
      });
      throw new BadRequestException('Discount code usage limit reached');
    }

    // Increment usage if requested
    if (incrementUsage) {
      const newUsageCount = discount.usageCount + 1;

      await this.prisma.discount.update({
        where: { id: discount.id },
        data: {
          usageCount: newUsageCount,
          // Automatically deactivate if max usage reached
          ...(discount.maxUsage &&
            newUsageCount >= discount.maxUsage && { active: false }),
        },
      });
    }

    return {
      type: discount.type,
      value: Number(discount.value),
      id: discount.id,
    };
  }

  calculateDiscountAmount(
    price: number,
    discountType: discount_type_enum,
    discountValue: number,
  ): number {
    // Calculate discount amount based on type
    if (discountType === 'percentage') {
      // For percentage discounts, calculate percentage of original price
      return (price * discountValue) / 100;
    }

    if (discountType === 'free_shipping') {
      // Free shipping doesn't discount the item price, only the shipping cost
      return 0;
    }

    // For fixed discounts, return the fixed amount or the total price if it's less
    return Math.min(price, discountValue);
  }

  incrementUsage(id: string): Promise<PrismaDiscount> {
    return this.prisma.discount.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  private generateRandomCode(length = 8): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  async generateDiscountForOrder(orderId: string): Promise<PrismaDiscount> {
    // Verify the order exists
    const order = await this.prisma.sticker_order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Generate a unique random code
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = this.generateRandomCode();
      const existing = await this.prisma.discount.findFirst({
        where: { code },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('Failed to generate unique discount code');
    }

    // Set validity period: valid from now, expires in 30 days
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Create the 10% discount with one-time usage
    return await this.prisma.discount.create({
      data: {
        code,
        type: 'percentage',
        value: 10,
        maxUsage: 1,
        active: true,
        validFrom: now,
        validUntil: expiryDate,
      },
    });
  }
}
