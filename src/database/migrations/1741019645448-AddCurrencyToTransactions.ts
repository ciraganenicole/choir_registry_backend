import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrencyToTransactions1741019645448 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE transactions 
      ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE transactions 
      DROP COLUMN currency
    `);
  }
} 