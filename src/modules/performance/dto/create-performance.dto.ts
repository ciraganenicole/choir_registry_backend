import { IsNotEmpty, IsDateString, IsEnum, IsOptional, IsNumber, IsString } from 'class-validator';
import { PerformanceType, PerformanceStatus } from '../performance.entity';

export class CreatePerformanceDto {
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  expectedAudience?: number;

  @IsNotEmpty()
  @IsEnum(PerformanceType)
  type: PerformanceType;

  @IsNotEmpty()
  @IsNumber()
  shiftLeadId: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(PerformanceStatus)
  status?: PerformanceStatus;
} 