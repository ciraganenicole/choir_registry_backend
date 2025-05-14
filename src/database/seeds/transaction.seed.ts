import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';

import { Transaction } from '../../modules/transactions/transaction.entity';
import {
  ExpenseCategories,
  IncomeCategories,
  TransactionType,
  SubCategories
} from '../../modules/transactions/enums/transactions-categories.enum';
import { User } from '../../modules/users/user.entity';
import { Currency } from '../../modules/transactions/transaction.entity';

export class TransactionSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    console.log('Starting to seed transactions...');
    const transactionRepository = dataSource.getRepository(Transaction);
    const userRepository = dataSource.getRepository(User);

    try {
      // Get some users for contributions
      const users = await userRepository.find({ take: 5 });
      
      if (users.length === 0) {
        console.log('No users found. Skipping user-related transactions.');
        return;
      }

      const transactions = [
        // Daily contributions from registered members
        ...users.map((user) => ({
          amount: 500,
          type: TransactionType.INCOME,
          category: IncomeCategories.DAILY,
          description: 'Daily contribution',
          transactionDate: new Date(),
          contributorId: user.id,
          currency: Currency.USD
        })),

        // External contributors (donations)
        {
          amount: 50000,
          type: TransactionType.INCOME,
          category: IncomeCategories.DONATION,
          description: 'Wedding celebration donation',
          transactionDate: new Date(),
          contributorId: null,
          externalContributorName: 'John Smith',
          externalContributorPhone: '+237612345678',
          currency: Currency.USD
        },
        {
          amount: 25000,
          type: TransactionType.INCOME,
          category: IncomeCategories.DONATION,
          description: 'Birthday celebration donation',
          transactionDate: new Date(),
          contributorId: null,
          externalContributorName: 'Marie Claire',
          externalContributorPhone: '+237623456789',
          currency: Currency.USD
        },

        // Special contributions from members
        {
          amount: 15000,
          type: TransactionType.INCOME,
          category: IncomeCategories.SPECIAL,
          description: 'Easter celebration contribution',
          transactionDate: new Date(),
          contributorId: users[0].id,
          currency: Currency.USD
        },
        {
          amount: 20000,
          type: TransactionType.INCOME,
          category: IncomeCategories.SPECIAL,
          description: 'Christmas celebration contribution',
          transactionDate: new Date(),
          contributorId: users[1].id,
          currency: Currency.USD
        },

        // External special contributions
        {
          amount: 100000,
          type: TransactionType.INCOME,
          category: IncomeCategories.SPECIAL,
          description: 'Special event contribution',
          transactionDate: new Date(),
          contributorId: null,
          externalContributorName: 'Robert Johnson',
          externalContributorPhone: '+237634567890',
          currency: Currency.USD
        },

        // Expenses - Charity
        {
          amount: 75000,
          type: TransactionType.EXPENSE,
          category: ExpenseCategories.CHARITY,
          subcategory: SubCategories.ILLNESS,
          description: 'Medical assistance for member',
          transactionDate: new Date(),
          contributorId: users[0].id,
          currency: Currency.USD
        },
        {
          amount: 50000,
          type: TransactionType.EXPENSE,
          category: ExpenseCategories.CHARITY,
          subcategory: SubCategories.DEATH,
          description: 'Funeral assistance',
          transactionDate: new Date(),
          contributorId: users[1].id,
          currency: Currency.USD
        },

        // Expenses - Maintenance
        {
          amount: 25000,
          type: TransactionType.EXPENSE,
          category: ExpenseCategories.MAINTENANCE,
          subcategory: SubCategories.BUY_DEVICES,
          description: 'Equipment repair',
          transactionDate: new Date(),
          contributorId: users[2].id,
          currency: Currency.USD
        },
        {
          amount: 150000,
          type: TransactionType.EXPENSE,
          category: ExpenseCategories.MAINTENANCE,
          subcategory: SubCategories.BUY_DEVICES,
          description: 'New sound system',
          transactionDate: new Date(),
          contributorId: users[3].id,
          currency: Currency.FC
        },

        // Expenses - Transport
        {
          amount: 35000,
          type: TransactionType.EXPENSE,
          category: ExpenseCategories.TRANSPORT,
          subcategory: SubCategories.COMMITTEE,
          description: 'Committee meeting transport',
          transactionDate: new Date(),
          contributorId: users[4].id,
          currency: Currency.FC
        },
        {
          amount: 45000,
          type: TransactionType.EXPENSE,
          category: ExpenseCategories.TRANSPORT,
          subcategory: SubCategories.SORTIE,
          description: 'Choir outing transport',
          transactionDate: new Date(),
          contributorId: users[0].id,
          currency: Currency.USD
        },

        // Other expenses
        {
          amount: 15000,
          type: TransactionType.EXPENSE,
          category: ExpenseCategories.COMMUNICATION,
          description: 'Phone credit for announcements',
          transactionDate: new Date(),
          contributorId: users[1].id,
          currency: Currency.USD
        },
        {
          amount: 85000,
          type: TransactionType.EXPENSE,
          category: ExpenseCategories.RESTAURATION,
          description: 'Refreshments for special event',
          transactionDate: new Date(),
          contributorId: users[2].id,
          currency: Currency.USD
        },
        {
          amount: 65000,
          type: TransactionType.EXPENSE,
          category: ExpenseCategories.SPECIAL_ASSISTANCE,
          description: 'Emergency assistance',
          transactionDate: new Date(),
          contributorId: users[3].id,
          currency: Currency.USD
        },
      ];

      // Add some transactions with different dates
      const pastTransactions = transactions.map((transaction) => ({
        ...transaction,
        transactionDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      }));

      // await transactionRepository.save([...transactions, ...pastTransactions]);
      console.log('Transaction seeding completed successfully');
    } catch (error) {
      console.error('Error seeding transactions:', error);
      throw error;
    }
  }
}

