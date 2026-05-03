import { IsBoolean, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/** Query params for ledger-style transaction lists (filtered slice of rows with pagination). */
export class TransactionHistoryQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  exportAll?: boolean;
}
