import { IsEnum, IsNumber, IsOptional, IsString, IsDate, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { 
  TransactionType, 
  IncomeCategories,
  ExpenseCategories,
  TransactionCategories 
} from '../../modules/transactions/transactions-categories.enum';
import { Currency } from '../../modules/transactions/transaction.entity';

export class CreateTransactionDto {
  @IsNumber()
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum({ ...IncomeCategories, ...ExpenseCategories })
  category: TransactionCategories;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Date)
  @IsDate()
  transactionDate: Date;

  @IsOptional()
  @IsNumber()
  contributorId?: number;

  @IsOptional()
  @IsString()
  externalContributorName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format',
  })
  externalContributorPhone?: string;

  currency: Currency;
}

export class TransactionFilterDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum({ ...IncomeCategories, ...ExpenseCategories })
  category?: TransactionCategories;

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
}
