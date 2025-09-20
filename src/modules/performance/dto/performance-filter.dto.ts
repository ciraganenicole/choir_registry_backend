import { IsOptional, IsEnum, IsDateString, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { PerformanceType, PerformanceStatus } from '../performance.entity';

export class PerformanceFilterDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(PerformanceType)
  type?: PerformanceType;

  @IsOptional()
  @IsEnum(PerformanceStatus)
  status?: PerformanceStatus;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  shiftLeadId?: number;
} 