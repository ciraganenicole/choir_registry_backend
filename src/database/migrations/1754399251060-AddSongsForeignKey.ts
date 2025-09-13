import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSongsForeignKey1754399251060 implements MigrationInterface {
  name = 'AddSongsForeignKey1754399251060';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the missing foreign key constraint from performance_songs to songs
    // This constraint couldn't be added in the performance detail tables migration
    // because the songs table didn't exist yet
    
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_performance_songs_song' 
          AND table_name = 'performance_songs'
        ) THEN
          ALTER TABLE "performance_songs"
          ADD CONSTRAINT "FK_performance_songs_song"
          FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "performance_songs" DROP CONSTRAINT IF EXISTS "FK_performance_songs_song";
    `);
  }
}
