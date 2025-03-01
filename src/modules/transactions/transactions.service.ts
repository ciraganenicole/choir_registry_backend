// src/transactions/transactions.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, Between } from 'typeorm';
import { Transaction } from './transactions.entity';
import { TransactionCategories, Subcategories } from './transactions-categories.enum';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  // Create a new transaction
  async createTransaction(
    userId: number,
    fullname: string,
    amount: number,
    category: TransactionCategories,
    subcategory: string,
  ): Promise<Transaction> {
    // Validate if the subcategory is valid for the category
    if (!this.isValidSubcategory(category, subcategory)) {
      throw new BadRequestException('Invalid subcategory for the selected category.');
    }

    const transaction = this.transactionsRepository.create({
      userId,
      fullname,
      amount,
      category,
      subcategory,
    });

    return this.transactionsRepository.save(transaction);
  }

  // Check if the subcategory is valid for the selected category
  private isValidSubcategory(category: TransactionCategories, subcategory: string): boolean {
    switch (category) {
      case TransactionCategories.CHARITY:
        return Object.values(Subcategories[TransactionCategories.CHARITY] as { [key: string]: string }).includes(subcategory);
      case TransactionCategories.MAINTENANCE:
        return Object.values(Subcategories[TransactionCategories.MAINTENANCE] as { [key: string]: string }).includes(subcategory);
      case TransactionCategories.TRANSPORT:
        return Object.values(Subcategories[TransactionCategories.TRANSPORT] as { [key: string]: string }).includes(subcategory);
      default:
        return true; // For other categories like 'daily', 'special', 'donation', subcategory isn't required
    }
  }

  // Get all transactions with advanced filtering
  async getTransactions(filters: {
    userId?: number;
    category?: TransactionCategories;
    subcategory?: string;
    date?: Date;
    amount?: number;
  }): Promise<Transaction[]> {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;

    if (filters.category) where.category = filters.category;

    if (filters.subcategory) where.subcategory = filters.subcategory;

    if (filters.date) where.date = filters.date;

    if (filters.amount !== undefined) {
      where.amount = filters.amount;
    }

    return this.transactionsRepository.find({ where });
  }

  // Get a specific transaction by ID
  async getTransactionById(id: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({ where: { id } });
    if (!transaction) {
      throw new BadRequestException('Transaction not found.');
    }
    return transaction;
  }

  // Get transactions by category
  async getTransactionsByCategory(category: TransactionCategories): Promise<Transaction[]> {
    return this.transactionsRepository.find({ where: { category } });
  }
}
