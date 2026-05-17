import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlbumAndPlaylistLinkTables1765900000000
  implements MigrationInterface
{
  name = 'CreateAlbumAndPlaylistLinkTables1765900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "albums" (
        "id" SERIAL NOT NULL,
        "label" character varying(255) NOT NULL DEFAULT '',
        CONSTRAINT "PK_albums" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "playlists" (
        "id" SERIAL NOT NULL,
        "label" character varying(255) NOT NULL DEFAULT '',
        CONSTRAINT "PK_playlists" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "playlists"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "albums"`);
  }
}
