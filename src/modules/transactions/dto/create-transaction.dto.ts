import { IsNotEmpty, IsNumber, IsString, IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, IncomeCategories, ExpenseCategories, SubCategories } from '../enums/transactions-categories.enum';
import { Currency } from '../transaction.entity';

export class CreateTransactionDto {
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsNotEmpty()
    @IsEnum(TransactionType)
    type: TransactionType;

    @IsNotEmpty()
    @IsEnum([...Object.values(IncomeCategories), ...Object.values(ExpenseCategories)])
    category: IncomeCategories | ExpenseCategories;

    @IsOptional()
    @IsEnum(SubCategories)
    subcategory?: SubCategories;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    transactionDate: Date;

    @IsOptional()
    @IsEnum(Currency)
    currency?: Currency;

    @IsOptional()
    @IsNumber()
    contributorId?: number;

    @IsOptional()
    @IsString()
    externalContributorName?: string;

    @IsOptional()
    @IsString()
    externalContributorPhone?: string;
} 