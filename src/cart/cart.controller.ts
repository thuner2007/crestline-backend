import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  Logger,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Throttle } from '@nestjs/throttler';
import { Public } from 'src/auth/decorators/public.decorator';

class CustomizationOptionDto {
  @IsString()
  type: string;

  @IsOptional()
  translations?: Record<string, any>;

  @IsOptional()
  @IsString()
  applicableTo?: string;

  @IsOptional()
  priceAdjustment?: number | null;

  @IsOptional()
  max?: number | null;

  @IsOptional()
  @IsArray()
  items?: Array<any> | null;

  @IsOptional()
  value?: string | null;
}

// DTO for adding a sticker to the cart
class AddStickerToCartDto {
  @IsOptional()
  @IsUUID()
  stickerId?: string;

  @IsOptional()
  @IsUUID()
  customStickerId?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  width: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  height: number;

  @IsBoolean()
  @Type(() => Boolean)
  vinyl: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  printed: boolean;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationOptionDto)
  customizationOptions?: CustomizationOptionDto[];
}

// DTO for adding a part to the cart
class AddPartToCartDto {
  @IsUUID()
  partId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationOptionDto)
  customizationOptions?: CustomizationOptionDto[];
}

// DTO for adding a powdercoat service to the cart
class AddPowdercoatServiceToCartDto {
  @IsUUID()
  powdercoatingServiceId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomizationOptionDto)
  customizationOptions?: CustomizationOptionDto[];
}

// DTO for getting item recommendations to reach 100 CHF
class GetRecommendationsDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  costAmount: number;

  @IsArray()
  @IsString({ each: true })
  itemsIdInCart: string[];
}

@Public()
@Throttle({ default: { limit: 15, ttl: 1000 } }) // Limited to 15 requests per second
@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  /**
   * Get cart - supports both authenticated (userId via JWT) and anonymous (anonymousToken) users
   * Either userId OR anonymousToken must be provided
   */
  @Get()
  async getCart(
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.getCart(userId, anonymousToken);
  }

  /**
   * Add sticker to cart - supports both authenticated and anonymous users
   */
  @Post('sticker')
  async addStickerToCart(
    @Body() addStickerDto: AddStickerToCartDto,
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.addStickerToCart(
      addStickerDto,
      userId,
      anonymousToken,
    );
  }

  /**
   * Add part to cart - supports both authenticated and anonymous users
   * Returns full part details including customization options with translations
   */
  @Post('part')
  async addPartToCart(
    @Body() addPartDto: AddPartToCartDto,
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.addPartToCart(addPartDto, userId, anonymousToken);
  }

  /**
   * Add powdercoat service to cart - supports both authenticated and anonymous users
   */
  @Post('powdercoat-service')
  async addPowdercoatServiceToCart(
    @Body() addPowdercoatServiceDto: AddPowdercoatServiceToCartDto,
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.addPowdercoatServiceToCart(
      addPowdercoatServiceDto,
      userId,
      anonymousToken,
    );
  }

  /**
   * Update sticker quantity in cart
   */
  @Patch('sticker/amount/:id')
  async updateStickerAmount(
    @Param('id') orderItemId: string,
    @Body('amount') amount: number,
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.updateStickerAmount(
      orderItemId,
      amount,
      userId,
      anonymousToken,
    );
  }

  /**
   * Update part quantity in cart
   */
  @Patch('part/amount/:id')
  async updatePartAmount(
    @Param('id') partOrderItemId: string,
    @Body('amount') amount: number,
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.updatePartAmount(
      partOrderItemId,
      amount,
      userId,
      anonymousToken,
    );
  }

  /**
   * Update powdercoat service quantity in cart
   */
  @Patch('powdercoat-service/amount/:id')
  async updatePowdercoatServiceAmount(
    @Param('id') powdercoatOrderItemId: string,
    @Body('amount') amount: number,
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.updatePowdercoatServiceAmount(
      powdercoatOrderItemId,
      amount,
      userId,
      anonymousToken,
    );
  }

  /**
   * Remove sticker from cart
   */
  @Delete('sticker/:id')
  async removeStickerFromCart(
    @Param('id') orderItemId: string,
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.removeStickerFromCart(
      orderItemId,
      userId,
      anonymousToken,
    );
  }

  /**
   * Remove part from cart
   */
  @Delete('part/:id')
  async removePartFromCart(
    @Param('id') partOrderItemId: string,
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.removePartFromCart(
      partOrderItemId,
      userId,
      anonymousToken,
    );
  }

  /**
   * Remove powdercoat service from cart
   */
  @Delete('powdercoat-service/:id')
  async removePowdercoatServiceFromCart(
    @Param('id') powdercoatOrderItemId: string,
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.removePowdercoatServiceFromCart(
      powdercoatOrderItemId,
      userId,
      anonymousToken,
    );
  }

  /**
   * Clear all items from cart
   */
  @Delete('clear')
  async clearCart(
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.clearCart(userId, anonymousToken);
  }

  /**
   * Delete entire cart
   */
  @Delete()
  async deleteWholeCart(
    @Query('userId') userId?: string,
    @Query('anonymousToken') anonymousToken?: string,
  ) {
    if (!userId && !anonymousToken) {
      throw new BadRequestException(
        'Either userId or anonymousToken is required',
      );
    }
    return this.cartService.deleteWholeCart(userId, anonymousToken);
  }

  /**
   * Get recommendations to reach 100 CHF
   */
  @Post('recommendations')
  async getRecommendations(@Body() dto: GetRecommendationsDto) {
    return this.cartService.getRecommendations(
      dto.costAmount,
      dto.itemsIdInCart,
    );
  }
}
