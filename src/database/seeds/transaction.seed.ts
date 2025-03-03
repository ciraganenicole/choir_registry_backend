import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

import { Transaction } from '../../modules/transactions/transaction.entity';
import {
  ExpenseCategories,
  IncomeCategories,
  TransactionType,
} from '../../modules/transactions/transactions-categories.enum';
import { User } from '../../modules/users/user.entity';

export class TransactionSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const transactionRepository = dataSource.getRepository(Transaction);
    const userRepository = dataSource.getRepository(User);

    // Get some users for contributions
    const users = await userRepository.find({ take: 5 });

    const transactions = [
      // Daily contributions from registered members
      ...users.map((user) => ({
        amount: 500,
        type: TransactionType.INCOME,
        category: IncomeCategories.DAILY,
        description: 'Daily contribution',
        transactionDate: new Date().toISOString().split('T')[0],
        contributor: user,
      })),

      // External contributors (donations)
      {
        amount: 50000,
        type: TransactionType.INCOME,
        category: IncomeCategories.DONATION,
        description: 'Wedding celebration donation',
        transactionDate: new Date().toISOString().split('T')[0],
        externalContributorName: 'John Smith',
        externalContributorPhone: '+237612345678',
      },
      {
        amount: 25000,
        type: TransactionType.INCOME,
        category: IncomeCategories.DONATION,
        description: 'Birthday celebration donation',
        transactionDate: new Date().toISOString().split('T')[0],
        externalContributorName: 'Marie Claire',
        externalContributorPhone: '+237623456789',
      },

      // Special contributions from members
      {
        amount: 15000,
        type: TransactionType.INCOME,
        category: IncomeCategories.SPECIAL,
        description: 'Easter celebration contribution',
        transactionDate: new Date().toISOString().split('T')[0],
        contributor: users[0],
      },
      {
        amount: 20000,
        type: TransactionType.INCOME,
        category: IncomeCategories.SPECIAL,
        description: 'Christmas celebration contribution',
        transactionDate: new Date().toISOString().split('T')[0],
        contributor: users[1],
      },

      // External special contributions
      {
        amount: 100000,
        type: TransactionType.INCOME,
        category: IncomeCategories.SPECIAL,
        description: 'Special event contribution',
        transactionDate: new Date().toISOString().split('T')[0],
        externalContributorName: 'Robert Johnson',
        externalContributorPhone: '+237634567890',
      },

      // Expenses - Charity
      {
        amount: 75000,
        type: TransactionType.EXPENSE,
        category: ExpenseCategories.CHARITY,
        subcategory: 'ILLNESS',
        description: 'Medical assistance for member',
        transactionDate: new Date().toISOString().split('T')[0],
      },
      {
        amount: 50000,
        type: TransactionType.EXPENSE,
        category: ExpenseCategories.CHARITY,
        subcategory: 'DEATH',
        description: 'Funeral assistance',
        transactionDate: new Date().toISOString().split('T')[0],
      },

      // Expenses - Maintenance
      {
        amount: 25000,
        type: TransactionType.EXPENSE,
        category: ExpenseCategories.MAINTENANCE,
        subcategory: 'MAINTENANCE',
        description: 'Equipment repair',
        transactionDate: new Date().toISOString().split('T')[0],
      },
      {
        amount: 150000,
        type: TransactionType.EXPENSE,
        category: ExpenseCategories.MAINTENANCE,
        subcategory: 'BUY_DEVICES',
        description: 'New sound system',
        transactionDate: new Date().toISOString().split('T')[0],
      },

      // Expenses - Transport
      {
        amount: 35000,
        type: TransactionType.EXPENSE,
        category: ExpenseCategories.TRANSPORT,
        subcategory: 'COMMITTEE',
        description: 'Committee meeting transport',
        transactionDate: new Date().toISOString().split('T')[0],
      },
      {
        amount: 45000,
        type: TransactionType.EXPENSE,
        category: ExpenseCategories.TRANSPORT,
        subcategory: 'SORTIE',
        description: 'Choir outing transport',
        transactionDate: new Date().toISOString().split('T')[0],
      },

      // Other expenses
      {
        amount: 15000,
        type: TransactionType.EXPENSE,
        category: ExpenseCategories.COMMUNICATION,
        description: 'Phone credit for announcements',
        transactionDate: new Date().toISOString().split('T')[0],
      },
      {
        amount: 85000,
        type: TransactionType.EXPENSE,
        category: ExpenseCategories.RESTAURATION,
        description: 'Refreshments for special event',
        transactionDate: new Date().toISOString().split('T')[0],
      },
      {
        amount: 65000,
        type: TransactionType.EXPENSE,
        category: ExpenseCategories.SPECIAL_ASSISTANCE,
        description: 'Emergency assistance',
        transactionDate: new Date().toISOString().split('T')[0],
      },
    ];

    // Add some transactions with different dates
    const pastTransactions = transactions.map((transaction) => ({
      ...transaction,
      transactionDate: new Date(
        Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split('T')[0],
    }));

    await transactionRepository.save([...transactions, ...pastTransactions]);
  }
}

