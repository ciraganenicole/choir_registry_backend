import { IsOptional, IsNumber, IsString, IsDate, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, IncomeCategories, ExpenseCategories, SubCategories } from '../enums/transactions-categories.enum';
import { Currency } from '../transaction.entity';

export class TransactionFilterDto {
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    startDate?: Date | string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endDate?: Date | string;

    @IsOptional()
    @IsEnum(TransactionType)
    type?: TransactionType;

    @IsOptional()
    @IsEnum([...Object.values(IncomeCategories), ...Object.values(ExpenseCategories)])
    category?: IncomeCategories | ExpenseCategories;

    @IsOptional()
    @IsEnum(SubCategories)
    subcategory?: SubCategories;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    contributorId?: number;

    @IsOptional()
    @IsEnum(Currency)
    currency?: Currency;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    exportAll?: boolean;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit?: number = 10;
} 