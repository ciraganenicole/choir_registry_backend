import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { TransactionType, IncomeCategories, ExpenseCategories, SubCategories } from './enums/transactions-categories.enum';

export enum Currency {
  USD = 'USD',
  FC = 'FC'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.transactions, { nullable: true })
  @JoinColumn({ name: 'contributorId' })
  contributor: User | null;

  @Column({ nullable: true })
  contributorId: number | null;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', enum: Currency, default: Currency.USD })
  currency: Currency;

  @Column({
    type: 'varchar',
    enum: TransactionType
  })
  type: TransactionType;

  @Column({
    type: 'varchar',
    enum: [
      IncomeCategories.DAILY,
      IncomeCategories.SPECIAL,
      IncomeCategories.DONATION,
      IncomeCategories.OTHER,
      ExpenseCategories.CHARITY,
      ExpenseCategories.MAINTENANCE,
      ExpenseCategories.TRANSPORT,
      ExpenseCategories.SPECIAL_ASSISTANCE,
      ExpenseCategories.COMMUNICATION,
      ExpenseCategories.RESTAURATION
    ]
  })
  category: IncomeCategories | ExpenseCategories;

  @Column({ 
    type: 'varchar', 
    enum: SubCategories,
    nullable: true 
  })
  subcategory?: SubCategories;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ nullable: true })
  externalContributorName?: string;

  @Column({ nullable: true })
  externalContributorPhone?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 