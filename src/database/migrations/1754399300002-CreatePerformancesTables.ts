import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePerformancesTables1754399300002 implements MigrationInterface {
  name = 'CreatePerformancesTables1754399300002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create performances table
    await queryRunner.query(`
      CREATE TABLE "performances" (
        "id" SERIAL PRIMARY KEY,
        "title" character varying(255) NOT NULL,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "location" character varying(255),
        "expectedAudience" integer,
        "type" character varying(50) NOT NULL DEFAULT 'Concert',
        "status" character varying(50) NOT NULL DEFAULT 'upcoming',
        "shiftLeadId" integer,
        "notes" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Add foreign key constraint to users table (if it exists)
    const usersTableExists = await queryRunner.hasTable('users');
    if (usersTableExists) {
      await queryRunner.query(`
        ALTER TABLE "performances"
        ADD CONSTRAINT "FK_performances_shift_lead"
        FOREIGN KEY ("shiftLeadId") REFERENCES "users"("id") ON DELETE SET NULL
      `);
    }

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_performances_date" ON "performances" ("date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_performances_status" ON "performances" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_performances_type" ON "performances" ("type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_performances_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_performances_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_performances_date"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "performances" DROP CONSTRAINT IF EXISTS "FK_performances_shift_lead"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "performances"`);
  }
}
