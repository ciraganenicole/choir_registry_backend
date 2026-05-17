import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShowInTableToContentFieldDefinitions1765700000000
  implements MigrationInterface
{
  name = 'AddShowInTableToContentFieldDefinitions1765700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "content_field_definitions"
      ADD COLUMN IF NOT EXISTS "showInTable" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "content_field_definitions"
      DROP COLUMN IF EXISTS "showInTable"
    `);
  }
}
