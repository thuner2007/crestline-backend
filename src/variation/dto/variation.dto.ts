import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateVariationGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  stickerIds?: string[];
}

export class UpdateVariationGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  stickerIds?: string[];
}

export class AddStickerToVariationDto {
  @IsUUID('4')
  @IsNotEmpty()
  stickerId: string;
}

export class RemoveStickerFromVariationDto {
  @IsUUID('4')
  @IsNotEmpty()
  stickerId: string;
}
