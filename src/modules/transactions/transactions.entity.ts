import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { TransactionCategories , Subcategories } from './transactions-categories.enum';
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  fullname: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: Object.values(TransactionCategories),
  })
  category: TransactionCategories;

  @Column({
    type: 'enum',
    enum: Object.values(Subcategories[TransactionCategories.CHARITY] || {}), // Defaulting to empty object if subcategories for a category are not found
    nullable: true,
  })
  subcategory: string;

  @CreateDateColumn()
  date: Date;

  // Validate that the subcategory matches the category at the entity level
  validateSubcategory(): boolean {
    // Check if the category is one of the Transaction categories that require subcategories
    if (this.category === TransactionCategories.CHARITY) {
      return Object.values(Subcategories[TransactionCategories.CHARITY] as { [key: string]: string }).includes(this.subcategory);
    } else if (this.category === TransactionCategories.MAINTENANCE) {
      return Object.values(Subcategories[TransactionCategories.MAINTENANCE]as { [key: string]: string }).includes(this.subcategory);
    } else if (this.category === TransactionCategories.TRANSPORT) {
      return Object.values(Subcategories[TransactionCategories.TRANSPORT]as { [key: string]: string }).includes(this.subcategory);
    }

    // No subcategory validation needed for non-Transaction categories (daily, special, donation, other)
    return true;
  }
}
