import { IsDate, IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../transactions-categories.enum';

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