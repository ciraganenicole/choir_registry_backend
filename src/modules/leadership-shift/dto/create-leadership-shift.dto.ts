import { IsString, IsDateString, IsNumber, IsOptional, IsEnum, Min, MaxLength } from 'class-validator';
import { ShiftStatus } from '../leadership-shift.entity';

export class CreateLeadershipShiftDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  leaderId: number;

  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
} 