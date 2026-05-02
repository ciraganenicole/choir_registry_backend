import { IsOptional, IsDateString, IsNumber, IsString, IsBoolean } from 'class-validator';
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

  /**
   * When true, return all rows matching filters (no page/limit). Still bounded by a server-side max in the service.
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  exportAll?: boolean;
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