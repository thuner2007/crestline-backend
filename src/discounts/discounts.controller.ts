import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/role.enum';
import { Public } from 'src/auth/decorators/public.decorator';
import { DiscountService } from './discount.service';
import { discount } from '@prisma/client';
import { CreateDiscountDto } from './dto/discount.dto';

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() createDiscountDto: CreateDiscountDto,
  ): Promise<discount> {
    return this.discountService.create(createDiscountDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(): Promise<discount[]> {
    return this.discountService.findAll();
  }

  @Public()
  @Get('validate/:code')
  async validateCode(@Param('code') code: string) {
    return this.discountService.validateCode(code);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string): Promise<discount> {
    return this.discountService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateDiscountDto: Partial<CreateDiscountDto>,
  ): Promise<discount> {
    return this.discountService.update(id, updateDiscountDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.discountService.remove(id);
  }

  @Public()
  @Post('generate/:orderId')
  async generateForOrder(@Param('orderId') orderId: string): Promise<discount> {
    return this.discountService.generateDiscountForOrder(orderId);
  }
}
