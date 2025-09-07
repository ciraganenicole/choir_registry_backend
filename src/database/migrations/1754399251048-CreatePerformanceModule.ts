import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePerformanceModule1754399251048 implements MigrationInterface {
  name = 'CreatePerformanceModule1754399251048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create performance type enum
    await queryRunner.query(`
      CREATE TYPE "public"."performance_type_enum" AS ENUM(
        'Concert',
        'Worship Service',
        'Special Event',
        'Recording Session',
        'Wedding',
        'Funeral',
        'Outreach',
        'Other'
      )
    `);

    // Create performance status enum
    await queryRunner.query(`
      CREATE TYPE "public"."performance_status_enum" AS ENUM(
        'upcoming',
        'in_preparation',
        'ready',
        'completed'
      )
    `);

    // Create performances table (principal fields only)
    await queryRunner.query(`
      CREATE TABLE "performances" (
        "id" SERIAL NOT NULL,
        "date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "location" character varying,
        "expectedAudience" integer,
        "type" "public"."performance_type_enum" NOT NULL DEFAULT 'Concert',
        "shiftLeadId" integer NOT NULL,
        "notes" text,
        "status" "public"."performance_status_enum" NOT NULL DEFAULT 'upcoming',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performances" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint for shift lead
    await queryRunner.query(`
      ALTER TABLE "performances" 
      ADD CONSTRAINT "FK_performances_shiftLead" 
      FOREIGN KEY ("shiftLeadId") REFERENCES "users"("id") ON DELETE NO ACTION
    `);

    // Add indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_performances_date" ON "performances" ("date")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_performances_type" ON "performances" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_performances_status" ON "performances" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_performances_shiftLeadId" ON "performances" ("shiftLeadId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_performances_shiftLeadId"`);
    await queryRunner.query(`DROP INDEX "IDX_performances_status"`);
    await queryRunner.query(`DROP INDEX "IDX_performances_type"`);
    await queryRunner.query(`DROP INDEX "IDX_performances_date"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "performances" DROP CONSTRAINT "FK_performances_shiftLead"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "performances"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."performance_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."performance_type_enum"`);
  }
}
