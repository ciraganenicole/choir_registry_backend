import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentFieldType } from '../enums/content-field-type.enum';

export class CreateContentFieldDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fieldKey: string;

  @IsEnum(ContentFieldType)
  fieldType: ContentFieldType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  showInTable?: boolean;

  @IsOptional()
  @IsObject()
  validation?: Record<string, unknown>;
}

export class UpdateContentFieldDto {
  @IsOptional()
  @IsEnum(ContentFieldType)
  fieldType?: ContentFieldType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  label?: string | null;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  showInTable?: boolean;

  @IsOptional()
  @IsObject()
  validation?: Record<string, unknown> | null;
}
