import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { TransactionType, IncomeCategories, ExpenseCategories } from './transactions-categories.enum';

export enum Currency {
  USD = 'USD',
  FC = 'FC'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.USD })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: TransactionType
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: [...Object.values(IncomeCategories), ...Object.values(ExpenseCategories)]
  })
  category: IncomeCategories | ExpenseCategories;

  @Column({ nullable: true })
  subcategory?: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date' })
  transactionDate: string;

  @Column({ nullable: true })
  externalContributorName?: string;

  @Column({ nullable: true })
  externalContributorPhone?: string;

  @ManyToOne(() => User, { nullable: true })
  contributor?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 