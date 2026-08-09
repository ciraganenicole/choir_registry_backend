import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsObject,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentStatus } from '../enums/content-status.enum';
import { ContentVisibility } from '../enums/content-visibility.enum';

export class CreateContentDto {
  @Type(() => Number)
  @IsInt()
  contentTypeId: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  linkedEntityType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  linkedEntityId?: number;

  @IsObject()
  fieldValues: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  audienceDepartmentId?: number | null;

  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;
}

export class UpdateContentDto {
  @IsOptional()
  @IsObject()
  fieldValues?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  audienceDepartmentId?: number | null;
}

export class ListContentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contentTypeId?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsEnum(ContentVisibility)
  visibility?: ContentVisibility;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  audienceDepartmentId?: number;

  @IsOptional()
  @IsString()
  linkedEntityType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  linkedEntityId?: number;

  /** JSON field key (letters, digits, underscore) — sorts lexically as text */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sortBy?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDir?: 'ASC' | 'DESC';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  search?: string;
}
