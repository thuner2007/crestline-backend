import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  IsOptional,
  IsObject,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { shipping_ready_enum } from '@prisma/client';

// Translation interface for multilingual content
interface Translation {
  title: string;
  description?: string;
}

// Interface for customization options
export interface CustomizationOptions {
  options: CustomizationOption[];
}

// Base interface for all customization option types
interface BaseCustomizationOption {
  type: 'color' | 'inputfield' | 'dropdown' | 'powdercoat' | 'filamentColor';
  translations: {
    de: Translation;
    en: Translation;
    fr: Translation;
    it: Translation;
  };
  priceAdjustment?: number; // Base price adjustment for the option itself
}

// Specific option types
interface InputFieldOption extends BaseCustomizationOption {
  type: 'inputfield';
  max?: number;
}

interface DropdownOption extends BaseCustomizationOption {
  type: 'dropdown';
  items: {
    id: string;
    priceAdjustment: number; // Price adjustment for this specific item
    translations: {
      de: Translation;
      en: Translation;
      fr: Translation;
      it: Translation;
    };
  }[];
}

interface ColorOption extends BaseCustomizationOption {
  type: 'color';
}

interface PowdercoatOption extends BaseCustomizationOption {
  type: 'powdercoat';
}

interface FilamentColorOption extends BaseCustomizationOption {
  type: 'filamentColor';
  filamentTypeId: string; // ID of the filament type to get colors from
}

// Union type for all option types
export type CustomizationOption =
  | InputFieldOption
  | DropdownOption
  | ColorOption
  | PowdercoatOption
  | FilamentColorOption;

export class CreatePartDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  initialPrice?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    // If it's already an object, return it directly
    if (typeof value === 'object' && value !== null) return value;
    // If it's a string, try to parse it
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return as is if parsing fails
      }
    }
    return value; // Return other types as is
  })
  customizationOptions?: CustomizationOptions;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortingRank?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  @IsString()
  type?: string;
  active?: boolean;

  @IsOptional()
  @IsEnum(shipping_ready_enum)
  shippingReady?: shipping_ready_enum;

  @IsOptional()
  @IsDateString()
  shippingDate?: string;

  // Array of group IDs to connect
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groups?: string[];

  // Array of filament type IDs to connect
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filamentTypeIds?: string[];

  // Optional: Add fields for translations
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  })
  translations?: {
    [language: string]: {
      title: string;
      description?: string;
    };
  };

  // Optional: Add fields for links
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  })
  links?: {
    id?: string; // For updates, we need to track existing links
    translations: {
      [language: string]: {
        title: string;
        url: string;
      };
    };
  }[];

  // Weight and dimensions
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  length?: number;
}

export class UpdatePartDto extends CreatePartDto {}

export class UpdateShippingReadyDto {
  @IsEnum(shipping_ready_enum)
  shippingReady: shipping_ready_enum;
}

export class UpdateShippingDateDto {
  @IsOptional()
  @IsDateString()
  shippingDate?: string | null;
}

export class UpdateOptionStockDto {
  @IsString()
  optionId: string;

  @IsString()
  optionItemId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity: number;
}
