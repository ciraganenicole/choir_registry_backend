import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { TransactionType, IncomeCategories, ExpenseCategories } from "../transactions-categories.enum";

export class TransactionFilters {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum({ ...IncomeCategories, ...ExpenseCategories })
  category?: IncomeCategories | ExpenseCategories;

  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @IsOptional()
  @IsString()
  search?: string;
} 