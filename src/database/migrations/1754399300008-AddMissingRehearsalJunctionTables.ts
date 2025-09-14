import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingRehearsalJunctionTables1754399300008 implements MigrationInterface {
  name = 'AddMissingRehearsalJunctionTables1754399300008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the missing rehearsal_song_lead_singers junction table
    await queryRunner.query(`
      CREATE TABLE "rehearsal_song_lead_singers" (
        "rehearsalSongId" integer NOT NULL,
        "userId" integer NOT NULL,
        CONSTRAINT "PK_rehearsal_song_lead_singers" PRIMARY KEY ("rehearsalSongId", "userId")
      )
    `);

    // Add foreign key constraints
    const usersTableExists = await queryRunner.hasTable('users');
    const rehearsalSongsTableExists = await queryRunner.hasTable('rehearsal_songs');

    if (rehearsalSongsTableExists) {
      await queryRunner.query(`
        ALTER TABLE "rehearsal_song_lead_singers"
        ADD CONSTRAINT "FK_rehearsal_song_lead_singers_rehearsal_song"
        FOREIGN KEY ("rehearsalSongId") REFERENCES "rehearsal_songs"("id") ON DELETE CASCADE
      `);
    }

    if (usersTableExists) {
      await queryRunner.query(`
        ALTER TABLE "rehearsal_song_lead_singers"
        ADD CONSTRAINT "FK_rehearsal_song_lead_singers_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      `);
    }

    // Add indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_rehearsal_song_lead_singers_rehearsal_song_id" ON "rehearsal_song_lead_singers" ("rehearsalSongId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rehearsal_song_lead_singers_user_id" ON "rehearsal_song_lead_singers" ("userId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsal_song_lead_singers_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsal_song_lead_singers_rehearsal_song_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "rehearsal_song_lead_singers" DROP CONSTRAINT IF EXISTS "FK_rehearsal_song_lead_singers_user"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_song_lead_singers" DROP CONSTRAINT IF EXISTS "FK_rehearsal_song_lead_singers_rehearsal_song"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "rehearsal_song_lead_singers"`);
  }
}
