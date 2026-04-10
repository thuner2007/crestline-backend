import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBikeModelDto {
  @IsString()
  manufacturer: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateBikeModelDto {
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class AssignBikeModelsDto {
  @IsString({ each: true })
  bikeModelIds: string[];
}
