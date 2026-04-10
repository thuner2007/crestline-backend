import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUrl,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BlogImageDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  altText?: string;
}

export class BlogLinkTranslationDto {
  @IsIn(['de', 'en', 'fr', 'it'])
  @IsNotEmpty()
  language: string;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}

export class BlogLinkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogLinkTranslationDto)
  @IsNotEmpty({ each: true })
  translations: BlogLinkTranslationDto[];
}

export class BlogTranslationDto {
  @IsIn(['de', 'en', 'fr', 'it'])
  @IsNotEmpty()
  language: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  markdownContent: string;
}

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  author: string;

  @IsDateString()
  @IsNotEmpty()
  writingDate: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogTranslationDto)
  @IsNotEmpty({ each: true })
  translations: BlogTranslationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogImageDto)
  @IsOptional()
  images?: BlogImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogLinkDto)
  @IsOptional()
  links?: BlogLinkDto[];
}

export class UpdateBlogDto {
  @IsString()
  @IsOptional()
  author?: string;

  @IsDateString()
  @IsOptional()
  writingDate?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogTranslationDto)
  @IsOptional()
  translations?: BlogTranslationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogImageDto)
  @IsOptional()
  images?: BlogImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogLinkDto)
  @IsOptional()
  links?: BlogLinkDto[];
}
