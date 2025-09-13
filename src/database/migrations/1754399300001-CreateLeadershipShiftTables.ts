import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLeadershipShiftTables1754399300001 implements MigrationInterface {
  name = 'CreateLeadershipShiftTables1754399300001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create leadership shifts table
    await queryRunner.query(`
      CREATE TABLE "leadership_shifts" (
        "id" SERIAL PRIMARY KEY,
        "name" character varying(100) NOT NULL,
        "description" text,
        "startDate" date NOT NULL,
        "endDate" date,
        "isActive" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create leadership shift members table
    await queryRunner.query(`
      CREATE TABLE "leadership_shift_members" (
        "id" SERIAL PRIMARY KEY,
        "shiftId" integer NOT NULL,
        "userId" integer NOT NULL,
        "role" character varying(100) NOT NULL,
        "startDate" date NOT NULL,
        "endDate" date,
        "isActive" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "leadership_shift_members"
      ADD CONSTRAINT "FK_leadership_shift_members_shift"
      FOREIGN KEY ("shiftId") REFERENCES "leadership_shifts"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "leadership_shift_members"
      ADD CONSTRAINT "FK_leadership_shift_members_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shifts_active" ON "leadership_shifts" ("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shift_members_shift" ON "leadership_shift_members" ("shiftId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shift_members_user" ON "leadership_shift_members" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_leadership_shift_members_active" ON "leadership_shift_members" ("isActive")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leadership_shift_members_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leadership_shift_members_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leadership_shift_members_shift"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_leadership_shifts_active"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "leadership_shift_members" DROP CONSTRAINT IF EXISTS "FK_leadership_shift_members_user"`);
    await queryRunner.query(`ALTER TABLE "leadership_shift_members" DROP CONSTRAINT IF EXISTS "FK_leadership_shift_members_shift"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "leadership_shift_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "leadership_shifts"`);
  }
}
