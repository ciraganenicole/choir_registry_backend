import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingColumnsToLeadershipShifts1754399300007 implements MigrationInterface {
  name = 'AddMissingColumnsToLeadershipShifts1754399300007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the shift_status_enum if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."shift_status_enum" AS ENUM('Upcoming', 'Active', 'Completed', 'Cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Add missing columns to leadership_shifts table
    await queryRunner.query(`
      ALTER TABLE "leadership_shifts" 
      ADD COLUMN "leaderId" integer,
      ADD COLUMN "status" "public"."shift_status_enum" NOT NULL DEFAULT 'Upcoming',
      ADD COLUMN "notes" text,
      ADD COLUMN "eventsScheduled" integer NOT NULL DEFAULT 0,
      ADD COLUMN "eventsCompleted" integer NOT NULL DEFAULT 0,
      ADD COLUMN "createdById" integer
    `);

    // Update existing date columns to use timestamp with time zone
    await queryRunner.query(`
      ALTER TABLE "leadership_shifts" 
      ALTER COLUMN "startDate" TYPE TIMESTAMP WITH TIME ZONE USING "startDate"::timestamp with time zone
    `);

    await queryRunner.query(`
      ALTER TABLE "leadership_shifts" 
      ALTER COLUMN "endDate" TYPE TIMESTAMP WITH TIME ZONE USING "endDate"::timestamp with time zone
    `);

    // Add foreign key constraints
    const usersTableExists = await queryRunner.hasTable('users');
    if (usersTableExists) {
      await queryRunner.query(`
        ALTER TABLE "leadership_shifts"
        ADD CONSTRAINT "FK_leadership_shifts_leader"
        FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE SET NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "leadership_shifts"
        ADD CONSTRAINT "FK_leadership_shifts_created_by"
        FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
      `);
    }

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shifts_leader" ON "leadership_shifts" ("leaderId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shifts_status" ON "leadership_shifts" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shifts_created_by" ON "leadership_shifts" ("createdById")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leadership_shifts_created_by"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leadership_shifts_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leadership_shifts_leader"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "leadership_shifts" DROP CONSTRAINT IF EXISTS "FK_leadership_shifts_created_by"`);
    await queryRunner.query(`ALTER TABLE "leadership_shifts" DROP CONSTRAINT IF EXISTS "FK_leadership_shifts_leader"`);

    // Revert date columns to date type
    await queryRunner.query(`
      ALTER TABLE "leadership_shifts" 
      ALTER COLUMN "startDate" TYPE date USING "startDate"::date
    `);

    await queryRunner.query(`
      ALTER TABLE "leadership_shifts" 
      ALTER COLUMN "endDate" TYPE date USING "endDate"::date
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "leadership_shifts" 
      DROP COLUMN IF EXISTS "createdById",
      DROP COLUMN IF EXISTS "eventsCompleted",
      DROP COLUMN IF EXISTS "eventsScheduled",
      DROP COLUMN IF EXISTS "notes",
      DROP COLUMN IF EXISTS "status",
      DROP COLUMN IF EXISTS "leaderId"
    `);

    // Note: We don't drop the enum type as it might be used by other tables
  }
}
