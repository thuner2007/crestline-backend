import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsEmail,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  sticker_order_paymentmethod_enum,
  sticker_order_status_enum,
  shipping_carrier_enum,
} from '@prisma/client';

// DTO for custom sticker within an order
export class CustomStickerDto {
  @IsString()
  image: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  originalImages?: string[];
}

// DTO for sticker order items
export class OrderItemDto {
  @IsOptional()
  @IsUUID()
  stickerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomStickerDto)
  customSticker?: CustomStickerDto;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsNumber()
  @Type(() => Number)
  width?: number;

  @IsNumber()
  @Type(() => Number)
  height?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  vinyl?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  printed?: boolean;

  @IsOptional()
  @IsArray()
  @Type(() => Object)
  customizationOptions?: any[];
}

// DTO for part order items
export class PartOrderItemDto {
  @IsUUID()
  partId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsArray()
  @Type(() => Object)
  customizationOptions?: any[];
}

// DTO for powdercoat service order items
export class PowdercoatServiceOrderItemDto {
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
  @Type(() => Object)
  customizationOptions?: any[];
}

// DTO for creating a sticker order
export class CreateStickerOrderDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  houseNumber?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  additionalAddressInfo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartOrderItemDto)
  partOrderItems?: PartOrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PowdercoatServiceOrderItemDto)
  powdercoatServiceOrderItems?: PowdercoatServiceOrderItemDto[];

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsEnum(sticker_order_paymentmethod_enum)
  paymentMethod: sticker_order_paymentmethod_enum;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @IsString()
  paymentId?: string;

  @IsOptional()
  @IsNumber()
  shipmentCost?: number;

  @IsOptional()
  @IsEnum(shipping_carrier_enum)
  shipmentCarrier?: shipping_carrier_enum;
}

// DTO for updating order status
export class UpdateStatusDto {
  @IsEnum(sticker_order_status_enum)
  status: sticker_order_status_enum;
}

// DTO for shipping address
export class ShippingAddressDto {
  @IsString()
  country: string;

  @IsString()
  city: string;

  @IsString()
  zipCode: string;

  @IsString()
  street: string;
}

// DTO for calculating price
export class CalculatePriceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems: OrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartOrderItemDto)
  partOrderItems?: PartOrderItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PowdercoatServiceOrderItemDto)
  powdercoatServiceOrderItems?: PowdercoatServiceOrderItemDto[];

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;
}

// DTO for creating a payment intent
export class CreatePaymentIntentDto {
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;
}

// DTO for payment success
export class PaymentSuccessDto {
  @IsString()
  paymentId: string;
}
