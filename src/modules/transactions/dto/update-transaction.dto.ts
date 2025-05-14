import { IsOptional, IsNumber, IsEnum, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, IncomeCategories, ExpenseCategories, SubCategories } from '../enums/transactions-categories.enum';
import { Currency } from '../transaction.entity';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTransactionDto } from './create-transaction.dto';

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @IsOptional()
  @IsNumber()
  amount?: number;

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
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  transactionDate?: Date | string;

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