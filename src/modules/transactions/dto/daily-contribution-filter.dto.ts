import { IsDateString, IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { TransactionType } from '../enums/transactions-categories.enum';

export class DailyContributionFilterDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsNumber()
    contributorId?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsEnum(TransactionType)
    type: TransactionType;
} 