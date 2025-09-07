import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSingleActiveShiftConstraint1754399251053 implements MigrationInterface {
  name = 'AddSingleActiveShiftConstraint1754399251053';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, resolve any existing conflicts by keeping only the most recent active shift
    await queryRunner.query(`
      WITH ranked_shifts AS (
        SELECT 
          id,
          ROW_NUMBER() OVER (ORDER BY "startDate" DESC) as rn
        FROM leadership_shifts 
        WHERE status = 'Active'
      )
      UPDATE leadership_shifts 
      SET status = 'Completed' 
      WHERE id IN (
        SELECT id FROM ranked_shifts WHERE rn > 1
      )
    `);

    // Add a unique partial index to ensure only one active shift at a time
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_single_active_shift 
      ON leadership_shifts (status) 
      WHERE status = 'Active'
    `);

    // Add a comment explaining the constraint
    await queryRunner.query(`
      COMMENT ON INDEX idx_single_active_shift IS 'Ensures only one leadership shift can be active at a time'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the unique constraint
    await queryRunner.query(`DROP INDEX IF EXISTS idx_single_active_shift`);
  }
}
