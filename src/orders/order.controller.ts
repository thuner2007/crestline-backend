import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  Request,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { StickerOrderService } from './order.service';
import { InvoiceService } from './invoice.service';
import {
  CreateStickerOrderDto,
  UpdateStatusDto,
  CalculatePriceDto,
  PaymentSuccessDto,
} from './dto/order.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';
import { sticker_order_status_enum } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { IsUserOrAdmin } from 'src/auth/decorators/isUserOrAdmin.decorator';

@Throttle({ default: { limit: 15, ttl: 1000 } }) // Limited to 15 requests per second
@Controller('orders')
export class StickerOrderController {
  constructor(
    private readonly stickerOrderService: StickerOrderService,
    private readonly invoiceService: InvoiceService,
  ) {}

  @Throttle({ default: { limit: 15, ttl: 1000 } }) // Limited to 15 requests per second
  @Public()
  @Post()
  async create(@Body() createStickerOrderDto: CreateStickerOrderDto) {
    return this.stickerOrderService.create(createStickerOrderDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: sticker_order_status_enum,
  ) {
    return this.stickerOrderService.findAll(
      undefined,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
    );
  }

  @Get('pending')
  @Roles(UserRole.ADMIN)
  async findPendingOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.stickerOrderService.findAll(
      undefined,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      sticker_order_status_enum.pending,
    );
  }

  @Get('my-orders')
  async findUserOrders(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: sticker_order_status_enum,
  ) {
    return this.stickerOrderService.findUserOrders(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
    );
  }

  @Public()
  @Post('calculate-price')
  @Throttle({ default: { limit: 50, ttl: 6000 } }) // Limited to 50 requests per 6 seconds
  async calculatePrice(@Body() data: CalculatePriceDto) {
    return this.stickerOrderService.calculatePrice(
      data.orderItems,
      data.partOrderItems || [],
      data.powdercoatServiceOrderItems || [],
      data.discountCode,
      data.shippingAddress,
    );
  }

  @Public()
  @Get('calculate-single-price')
  @Throttle({ default: { limit: 50, ttl: 6000 } }) // Limited to 50 requests per 6 seconds
  async calculateSinglePrice(
    @Query('width') width?: string,
    @Query('height') height?: string,
    @Query('vinyl') vinyl?: string,
    @Query('printed') printed?: string,
    @Query('stickerId') stickerId?: string,
    @Query('partId') partId?: string,
    @Query('quantity') quantity?: string,
    @Query('customizationOptions') customizationOptions?: string,
  ) {
    return this.stickerOrderService.calculateSinglePrice({
      stickerId,
      partId,
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      vinyl: vinyl === 'true',
      printed: printed === 'true',
      quantity: quantity ? Number(quantity) : 1,
      customizationOptions: customizationOptions
        ? JSON.parse(customizationOptions)
        : undefined,
    });
  }

  @Get('user/:userId')
  @IsUserOrAdmin()
  async getUserOrders(
    @Param('userId') userId: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('status') status?: sticker_order_status_enum,
  ) {
    // Set safe default values
    const limitNum = parseInt(limit) || 10;
    const offsetNum = parseInt(offset) || 0;
    const page = offsetNum > 0 ? Math.floor(offsetNum / limitNum) + 1 : 1;

    return this.stickerOrderService.findAll(userId, page, limitNum, status);
  }

  @Get(':id/invoice')
  @Roles(UserRole.ADMIN)
  async getInvoice(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.invoiceService.generateInvoicePdf(id);
    const orderDate = new Date().toISOString().split('T')[0];
    const filename = `Invoice_RevSticks_${id.substring(0, 8).toUpperCase()}_${orderDate}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    });
    res.end(pdfBuffer);
  }

  @Get('search')
  @Roles(UserRole.ADMIN)
  async searchOrders(
    @Query('q') q: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!q || q.trim() === '') {
      throw new BadRequestException('Search query q is required');
    }
    return this.stickerOrderService.searchOrders(
      q.trim(),
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    // If user is authenticated, pass userId for authorization check
    const userId = req.user?.id;
    return this.stickerOrderService.findOne(id, userId);
  }

  @Throttle({ default: { limit: 15, ttl: 1000 } }) // Limited to 15 requests per second
  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.stickerOrderService.updateStatus(id, updateStatusDto);
  }

  @Public()
  @Post(':id/paymentSuccess')
  async paymentSuccess(
    @Param('id') orderId: string,
    @Body() paymentSuccessDto: PaymentSuccessDto,
  ) {
    return this.stickerOrderService.paymentSuccess(
      orderId,
      paymentSuccessDto.paymentId,
    );
  }
}
