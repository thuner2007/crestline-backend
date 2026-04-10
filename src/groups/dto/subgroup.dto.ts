import {
  IsString,
  IsObject,
  ValidateNested,
  IsOptional,
} from 'class-validator';

export class CreateSubgroupDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  groupId: string;

  @IsObject()
  @ValidateNested()
  translations: {
    en: { name: string };
    de?: { name: string };
    fr?: { name: string };
    it?: { name: string };
  };
}
