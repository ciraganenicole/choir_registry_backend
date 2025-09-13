import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRehearsalsTables1754399300003 implements MigrationInterface {
  name = 'CreateRehearsalsTables1754399300003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create rehearsals table
    await queryRunner.query(`
      CREATE TABLE "rehearsals" (
        "id" SERIAL PRIMARY KEY,
        "title" character varying(255) NOT NULL,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "type" character varying(50) NOT NULL DEFAULT 'General Practice',
        "status" character varying(50) NOT NULL DEFAULT 'Planning',
        "location" character varying(255),
        "duration" integer,
        "performanceId" integer,
        "rehearsalLeadId" integer,
        "shiftLeadId" integer,
        "isTemplate" boolean NOT NULL DEFAULT false,
        "notes" text,
        "objectives" text,
        "feedback" text,
        "createdById" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Add foreign key constraints (checking table existence first)
    const performancesTableExists = await queryRunner.hasTable('performances');
    const usersTableExists = await queryRunner.hasTable('users');

    if (performancesTableExists) {
      await queryRunner.query(`
        ALTER TABLE "rehearsals"
        ADD CONSTRAINT "FK_rehearsals_performance"
        FOREIGN KEY ("performanceId") REFERENCES "performances"("id") ON DELETE CASCADE
      `);
    }

    if (usersTableExists) {
      await queryRunner.query(`
        ALTER TABLE "rehearsals"
        ADD CONSTRAINT "FK_rehearsals_rehearsal_lead"
        FOREIGN KEY ("rehearsalLeadId") REFERENCES "users"("id") ON DELETE SET NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "rehearsals"
        ADD CONSTRAINT "FK_rehearsals_shift_lead"
        FOREIGN KEY ("shiftLeadId") REFERENCES "users"("id") ON DELETE SET NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "rehearsals"
        ADD CONSTRAINT "FK_rehearsals_created_by"
        FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
      `);
    }

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_rehearsals_date" ON "rehearsals" ("date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rehearsals_status" ON "rehearsals" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rehearsals_type" ON "rehearsals" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rehearsals_performance" ON "rehearsals" ("performanceId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsals_performance"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsals_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsals_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsals_date"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "rehearsals" DROP CONSTRAINT IF EXISTS "FK_rehearsals_created_by"`);
    await queryRunner.query(`ALTER TABLE "rehearsals" DROP CONSTRAINT IF EXISTS "FK_rehearsals_shift_lead"`);
    await queryRunner.query(`ALTER TABLE "rehearsals" DROP CONSTRAINT IF EXISTS "FK_rehearsals_rehearsal_lead"`);
    await queryRunner.query(`ALTER TABLE "rehearsals" DROP CONSTRAINT IF EXISTS "FK_rehearsals_performance"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "rehearsals"`);
  }
}
