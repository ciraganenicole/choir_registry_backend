import { IsOptional, IsDateString, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class DailyContributionFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  contributorId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  timeFrame?: 'monthly' | 'quarterly' | 'yearly';
}

export class DailyContributionSummary {
  userId: number;
  firstName: string;
  lastName: string;
  totalAmountUSD: number;
  totalAmountFC: number;
  contributionDates: string[];
  lastContribution: Date;
  frequency: number; // contributions per month
} 