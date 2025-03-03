import { IsOptional, IsDate, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class DailyContributionFilterDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  contributorId?: number;

  @IsOptional()
  @IsString()
  search?: string;

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