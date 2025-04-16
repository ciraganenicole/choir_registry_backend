import { IsDate, IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { TransactionType } from '../enums/transactions-categories.enum';
import { Type } from 'class-transformer';

export class DailyContributionFilterDto {
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    startDate?: Date;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    endDate?: Date;

    @IsOptional()
    @IsNumber()
    contributorId?: number;

    @IsOptional()
    @IsString()
    search?: string;

    @IsEnum(TransactionType)
    type: TransactionType;
} 