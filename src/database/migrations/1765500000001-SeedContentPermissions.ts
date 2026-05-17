import { MigrationInterface, QueryRunner } from 'typeorm';

const PERMISSION_CODES = [
  'global.viewer',
  'global.editor',
  'global.publisher',
  'content.department.edit',
  'content.department.approve',
  'content.schema.manage',
];

export class SeedContentPermissions1765500000001 implements MigrationInterface {
  name = 'SeedContentPermissions1765500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const code of PERMISSION_CODES) {
      await queryRunner.query(
        `
                INSERT INTO "permissions" ("code", "description", "createdAt", "updatedAt")
                VALUES ($1::varchar, $2::text, now(), now())
                ON CONFLICT ("code") DO NOTHING
            `,
        [code, code],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = PERMISSION_CODES.map((_, i) => `$${i + 1}`).join(', ');
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "code" IN (${codes})`,
      PERMISSION_CODES,
    );
  }
}
