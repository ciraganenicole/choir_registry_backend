import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSongDepartmentAlbumAudio1766000000000
  implements MigrationInterface
{
  name = 'AddSongDepartmentAlbumAudio1766000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "songs"
      ADD COLUMN IF NOT EXISTS "audioUrl" text,
      ADD COLUMN IF NOT EXISTS "duration" character varying(16),
      ADD COLUMN IF NOT EXISTS "departmentId" integer,
      ADD COLUMN IF NOT EXISTS "albumId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "songs"
      ADD CONSTRAINT "FK_songs_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id")
      ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "songs"
      ADD CONSTRAINT "FK_songs_album"
      FOREIGN KEY ("albumId") REFERENCES "albums"("id")
      ON DELETE SET NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_songs_departmentId" ON "songs" ("departmentId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_songs_albumId" ON "songs" ("albumId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_songs_albumId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_songs_departmentId"`);
    await queryRunner.query(`
      ALTER TABLE "songs" DROP CONSTRAINT IF EXISTS "FK_songs_album"
    `);
    await queryRunner.query(`
      ALTER TABLE "songs" DROP CONSTRAINT IF EXISTS "FK_songs_department"
    `);
    await queryRunner.query(`
      ALTER TABLE "songs"
      DROP COLUMN IF EXISTS "albumId",
      DROP COLUMN IF EXISTS "departmentId",
      DROP COLUMN IF EXISTS "duration",
      DROP COLUMN IF EXISTS "audioUrl"
    `);
  }
}
