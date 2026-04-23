import {
  IsString,
  IsObject,
  ValidateNested,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePartSectionDto {
  @IsObject()
  @ValidateNested()
  translations: {
    en: { title: string; description?: string };
    de?: { title: string; description?: string };
    fr?: { title: string; description?: string };
    it?: { title: string; description?: string };
  };

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortingRank?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePartSectionDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  translations?: {
    en?: { title: string; description?: string };
    de?: { title: string; description?: string };
    fr?: { title: string; description?: string };
    it?: { title: string; description?: string };
  };

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortingRank?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AssignPartsToSectionDto {
  @IsString({ each: true })
  partIds: string[];
}
