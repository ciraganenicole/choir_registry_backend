import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeadershipShiftTables1751613305881 implements MigrationInterface {
  name = 'CreateLeadershipShiftTables1751613305881';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create shift_status_enum
    await queryRunner.query(`
      CREATE TYPE "shift_status_enum" AS ENUM (
        'Active',
        'Upcoming',
        'Completed',
        'Cancelled'
      )
    `);

    // Create leadership_shifts table
    await queryRunner.query(`
      CREATE TABLE "leadership_shifts" (
        "id" SERIAL NOT NULL,
        "name" character varying(100) NOT NULL,
        "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "leaderId" integer NOT NULL,
        "status" "shift_status_enum" NOT NULL DEFAULT 'Upcoming',
        "description" text,
        "notes" text,
        "eventsScheduled" integer NOT NULL DEFAULT '0',
        "eventsCompleted" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "createdById" integer,
        CONSTRAINT "PK_leadership_shifts" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "leadership_shifts" 
      ADD CONSTRAINT "FK_leadership_shifts_leader" 
      FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "leadership_shifts" 
      ADD CONSTRAINT "FK_leadership_shifts_created_by" 
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Create indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shifts_leader" ON "leadership_shifts" ("leaderId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shifts_status" ON "leadership_shifts" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shifts_dates" ON "leadership_shifts" ("startDate", "endDate")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shifts_created_by" ON "leadership_shifts" ("createdById")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_leadership_shifts_created_by"`);
    await queryRunner.query(`DROP INDEX "IDX_leadership_shifts_dates"`);
    await queryRunner.query(`DROP INDEX "IDX_leadership_shifts_status"`);
    await queryRunner.query(`DROP INDEX "IDX_leadership_shifts_leader"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "leadership_shifts" DROP CONSTRAINT "FK_leadership_shifts_created_by"`);
    await queryRunner.query(`ALTER TABLE "leadership_shifts" DROP CONSTRAINT "FK_leadership_shifts_leader"`);

    // Drop table
    await queryRunner.query(`DROP TABLE "leadership_shifts"`);

    // Drop enum
    await queryRunner.query(`DROP TYPE "shift_status_enum"`);
  }
} 