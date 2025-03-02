import { Controller, Post, Body, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { Transaction } from './transactions.entity';
import { TransactionCategories } from './transactions-categories.enum';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Create a new transaction
  @Post()
  async createTransaction(
    @Body() createTransactionDto: {
      userId: number;
      fullname: string;
      amount: number;
      category: TransactionCategories;
      subcategory?: string; // Optional subcategory
    },
  ): Promise<Transaction> {
    const { userId, fullname, amount, category, subcategory } = createTransactionDto;

    // Handle cases where subcategory is required (for expense categories)
    if (subcategory === undefined && this.isSubcategoryRequired(category)) {
      throw new BadRequestException('Subcategory is required for this category.');
    }

    // Create a new transaction
    try {
      return await this.transactionsService.createTransaction(
        userId,
        fullname,
        amount,
        category,
        subcategory || '',
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  // Define a subset type for expense categories
  private expenseCategories: TransactionCategories[] = [
    TransactionCategories.CHARITY,
    TransactionCategories.MAINTENANCE,
    TransactionCategories.TRANSPORT,
  ];

  // Check if the subcategory is required for the selected category
  private isSubcategoryRequired(category: TransactionCategories): boolean {
    // Subcategory is required for Expense Categories (CHARITY, MAINTENANCE, TRANSPORT)
    return this.expenseCategories.includes(category);
  }

  // Get all transactions with filters (userId, category, subcategory, date range, amount)
  @Get()
  async getTransactions(
    @Query('userId') userId?: number,
    @Query('category') category?: TransactionCategories,
    @Query('subcategory') subcategory?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('amount') amount?: number,
  ): Promise<Transaction[]> {
    console.log('Filters:', { userId, category, subcategory, amount });

    return await this.transactionsService.getTransactions({
      userId,
      category,
      dateRange: dateFrom && dateTo ? { from: new Date(dateFrom), to: new Date(dateTo) } : undefined,
      subcategory,
      amount,
    });
  }

  // Get a specific transaction by ID
  @Get(':id')
  async getTransaction(@Param('id') id: number): Promise<Transaction> {
    const transaction = await this.transactionsService.getTransactionById(id);
    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }
    return transaction;
  }
}
