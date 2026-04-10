import {
  IsString,
  IsObject,
  ValidateNested,
  IsOptional,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @ValidateNested()
  translations: {
    en: { title: string };
    de?: { title: string };
    fr?: { title: string };
    it?: { title: string };
  };
}

export class CreatePartGroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsObject()
  @ValidateNested()
  translations: {
    en: { title: string };
    de?: { title: string };
    fr?: { title: string };
    it?: { title: string };
  };
}
