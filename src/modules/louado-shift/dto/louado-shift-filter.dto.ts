import { IsDateString, IsOptional } from 'class-validator';

export class LouadoShiftFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

