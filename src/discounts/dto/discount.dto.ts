import { discount_type_enum } from '@prisma/client';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateDiscountDto {
  @IsString()
  code: string;

  @IsEnum(discount_type_enum)
  type: discount_type_enum;

  @IsNumber()
  @Transform(({ value }) => Number(value))
  value: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validFrom?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validUntil?: Date;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  maxUsage?: number;
}
