import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParentDepartmentToDepartments1765600000000 implements MigrationInterface {
  name = 'AddParentDepartmentToDepartments1765600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "departments"
      ADD COLUMN "parentDepartmentId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "departments"
      ADD CONSTRAINT "FK_departments_parent"
      FOREIGN KEY ("parentDepartmentId") REFERENCES "departments"("id")
      ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_departments_parentDepartmentId"
      ON "departments" ("parentDepartmentId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_departments_parentDepartmentId"`);
    await queryRunner.query(`
      ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "FK_departments_parent"
    `);
    await queryRunner.query(`
      ALTER TABLE "departments" DROP COLUMN IF EXISTS "parentDepartmentId"
    `);
  }
}
