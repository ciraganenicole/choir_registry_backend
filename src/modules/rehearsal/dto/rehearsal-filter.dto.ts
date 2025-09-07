import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { RehearsalType, RehearsalStatus } from '../rehearsal.entity';

export class RehearsalFilterDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RehearsalType)
  type?: RehearsalType;

  @IsOptional()
  @IsEnum(RehearsalStatus)
  status?: RehearsalStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  songId?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  shiftLeadId?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isTemplate?: boolean;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  performanceId?: number;
}
