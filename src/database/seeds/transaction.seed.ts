import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from '../../modules/transactions/transactions.entity';
import { TransactionCategories, Subcategories } from '../../modules/transactions/transactions-categories.enum';

@Injectable()
export class TransactionsSeedService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  // Function to generate a random transaction without faker
  private generateRandomTransaction(): Partial<Transaction> {
    const categories = Object.values(TransactionCategories);

    // Filter categories that have subcategories
    const categoriesWithSubcategories = categories.filter((category) => 
      this.isCategoryWithSubcategories(category)
    );

    const category = categoriesWithSubcategories[Math.floor(Math.random() * categoriesWithSubcategories.length)];
    let subcategory: string | undefined = undefined;

    // If category has subcategories, get one randomly
    if (this.isCategoryWithSubcategories(category)) {
      subcategory = this.getRandomSubcategory(category);
    }

    // Static name or dynamic name generation
    const names = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown']; // Example name list
    const fullname = names[Math.floor(Math.random() * names.length)];

    return {
      userId: Math.floor(Math.random() * 10) + 1, // Random userId between 1 and 10
      fullname, // Random full name
      amount: Math.random() * (500 - 10) + 10, // Random amount between 10 and 500
      category,
      subcategory,
      date: new Date(),
    };
  }

  // Type guard to check if the category has subcategories
  private isCategoryWithSubcategories(category: TransactionCategories): boolean {
    return category in Subcategories;
  }

  // Get a random subcategory based on the expense category
  private getRandomSubcategory(category: TransactionCategories): string {
    const subcategories = Object.values(Subcategories[category as keyof typeof Subcategories]) as string[];
    return subcategories[Math.floor(Math.random() * subcategories.length)];
  }

  // Seed the database with random transactions
  async seedTransactions() {
    const transactions = Array.from({ length: 50 }).map(() => this.generateRandomTransaction()); // Generate 50 random transactions

    await this.transactionsRepository.save(transactions);
    console.log('Random transactions have been seeded.');
  }
}
export const seedTransactions = async (dataSource: DataSource) => {
  const transactionRepository = dataSource.getRepository(Transaction);
  const service = new TransactionsSeedService(transactionRepository);

  await service.seedTransactions();
  console.log('Transactions seeding completed.');
};
