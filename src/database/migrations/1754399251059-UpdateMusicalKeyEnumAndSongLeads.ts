import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMusicalKeyEnumAndSongLeads1754399251059 implements MigrationInterface {
  name = 'UpdateMusicalKeyEnumAndSongLeads1754399251059';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, change the column types to text to remove the enum dependency
    await queryRunner.query(`ALTER TABLE "rehearsal_songs" ALTER COLUMN "musicalKey" TYPE text`);
    await queryRunner.query(`ALTER TABLE "performance_songs" ALTER COLUMN "musicalKey" TYPE text`);
    
    // Update existing data to match the new simplified format
    await queryRunner.query(`
      UPDATE "rehearsal_songs" 
      SET "musicalKey" = CASE 
        WHEN "musicalKey" = 'C Major' THEN 'C'
        WHEN "musicalKey" = 'G Major' THEN 'G'
        WHEN "musicalKey" = 'D Major' THEN 'D'
        WHEN "musicalKey" = 'A Major' THEN 'A'
        WHEN "musicalKey" = 'E Major' THEN 'E'
        WHEN "musicalKey" = 'B Major' THEN 'B'
        WHEN "musicalKey" = 'F# Major' THEN 'F#'
        WHEN "musicalKey" = 'C# Major' THEN 'C#'
        WHEN "musicalKey" = 'F Major' THEN 'F'
        WHEN "musicalKey" = 'Bb Major' THEN 'B'
        WHEN "musicalKey" = 'Eb Major' THEN 'E'
        WHEN "musicalKey" = 'Ab Major' THEN 'A'
        WHEN "musicalKey" = 'Db Major' THEN 'D'
        WHEN "musicalKey" = 'Gb Major' THEN 'G'
        WHEN "musicalKey" = 'Cb Major' THEN 'C'
        WHEN "musicalKey" = 'A Minor' THEN 'A'
        WHEN "musicalKey" = 'E Minor' THEN 'E'
        WHEN "musicalKey" = 'B Minor' THEN 'B'
        WHEN "musicalKey" = 'F# Minor' THEN 'F#'
        WHEN "musicalKey" = 'C# Minor' THEN 'C#'
        WHEN "musicalKey" = 'G# Minor' THEN 'G#'
        WHEN "musicalKey" = 'D# Minor' THEN 'D#'
        WHEN "musicalKey" = 'A# Minor' THEN 'A#'
        WHEN "musicalKey" = 'D Minor' THEN 'D'
        WHEN "musicalKey" = 'G Minor' THEN 'G'
        WHEN "musicalKey" = 'C Minor' THEN 'C'
        WHEN "musicalKey" = 'F Minor' THEN 'F'
        WHEN "musicalKey" = 'Bb Minor' THEN 'B'
        WHEN "musicalKey" = 'Eb Minor' THEN 'E'
        WHEN "musicalKey" = 'Ab Minor' THEN 'A'
        WHEN "musicalKey" = 'Db Minor' THEN 'D'
        WHEN "musicalKey" = 'Gb Minor' THEN 'G'
        WHEN "musicalKey" = 'Cb Minor' THEN 'C'
        ELSE "musicalKey"
      END
      WHERE "musicalKey" IS NOT NULL
    `);
    
    await queryRunner.query(`
      UPDATE "performance_songs" 
      SET "musicalKey" = CASE 
        WHEN "musicalKey" = 'C Major' THEN 'C'
        WHEN "musicalKey" = 'G Major' THEN 'G'
        WHEN "musicalKey" = 'D Major' THEN 'D'
        WHEN "musicalKey" = 'A Major' THEN 'A'
        WHEN "musicalKey" = 'E Major' THEN 'E'
        WHEN "musicalKey" = 'B Major' THEN 'B'
        WHEN "musicalKey" = 'F# Major' THEN 'F#'
        WHEN "musicalKey" = 'C# Major' THEN 'C#'
        WHEN "musicalKey" = 'F Major' THEN 'F'
        WHEN "musicalKey" = 'Bb Major' THEN 'B'
        WHEN "musicalKey" = 'Eb Major' THEN 'E'
        WHEN "musicalKey" = 'Ab Major' THEN 'A'
        WHEN "musicalKey" = 'Db Major' THEN 'D'
        WHEN "musicalKey" = 'Gb Major' THEN 'G'
        WHEN "musicalKey" = 'Cb Major' THEN 'C'
        WHEN "musicalKey" = 'A Minor' THEN 'A'
        WHEN "musicalKey" = 'E Minor' THEN 'E'
        WHEN "musicalKey" = 'B Minor' THEN 'B'
        WHEN "musicalKey" = 'F# Minor' THEN 'F#'
        WHEN "musicalKey" = 'C# Minor' THEN 'C#'
        WHEN "musicalKey" = 'G# Minor' THEN 'G#'
        WHEN "musicalKey" = 'D# Minor' THEN 'D#'
        WHEN "musicalKey" = 'A# Minor' THEN 'A#'
        WHEN "musicalKey" = 'D Minor' THEN 'D'
        WHEN "musicalKey" = 'G Minor' THEN 'G'
        WHEN "musicalKey" = 'C Minor' THEN 'C'
        WHEN "musicalKey" = 'F Minor' THEN 'F'
        WHEN "musicalKey" = 'Bb Minor' THEN 'B'
        WHEN "musicalKey" = 'Eb Minor' THEN 'E'
        WHEN "musicalKey" = 'Ab Minor' THEN 'A'
        WHEN "musicalKey" = 'Db Minor' THEN 'D'
        WHEN "musicalKey" = 'Gb Minor' THEN 'G'
        WHEN "musicalKey" = 'Cb Minor' THEN 'C'
        ELSE "musicalKey"
      END
      WHERE "musicalKey" IS NOT NULL
    `);
    
    // Now we can drop the old musical key enum
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."musical_key_enum"`);
    
    // Create the new musical key enum with only the specified keys
    await queryRunner.query(`
      CREATE TYPE "public"."musical_key_enum" AS ENUM('C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B')
    `);
    
    // Change the columns back to use the new enum
    await queryRunner.query(`ALTER TABLE "rehearsal_songs" ALTER COLUMN "musicalKey" TYPE "public"."musical_key_enum" USING "musicalKey"::"public"."musical_key_enum"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" ALTER COLUMN "musicalKey" TYPE "public"."musical_key_enum" USING "musicalKey"::"public"."musical_key_enum"`);

    // Drop the old leadSingerId column from rehearsal_songs
    await queryRunner.query(`ALTER TABLE "rehearsal_songs" DROP COLUMN IF EXISTS "leadSingerId"`);
    
    // Drop the foreign key constraint if it exists
    await queryRunner.query(`ALTER TABLE "rehearsal_songs" DROP CONSTRAINT IF EXISTS "FK_rehearsal_songs_lead_singer"`);
    
    // Create the new junction table for lead singers
    await queryRunner.query(`
      CREATE TABLE "rehearsal_song_lead_singers" (
        "rehearsalSongId" integer NOT NULL,
        "userId" integer NOT NULL,
        CONSTRAINT "PK_rehearsal_song_lead_singers" PRIMARY KEY ("rehearsalSongId", "userId")
      )
    `);
    
    // Add foreign key constraints for the junction table
    await queryRunner.query(`
      ALTER TABLE "rehearsal_song_lead_singers" 
      ADD CONSTRAINT "FK_rehearsal_song_lead_singers_rehearsal_song" 
      FOREIGN KEY ("rehearsalSongId") REFERENCES "rehearsal_songs"("id") ON DELETE CASCADE
    `);
    
    await queryRunner.query(`
      ALTER TABLE "rehearsal_song_lead_singers" 
      ADD CONSTRAINT "FK_rehearsal_song_lead_singers_user" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the junction table
    await queryRunner.query(`DROP TABLE "rehearsal_song_lead_singers"`);
    
    // Add back the leadSingerId column
    await queryRunner.query(`ALTER TABLE "rehearsal_songs" ADD "leadSingerId" integer`);
    
    // Add back the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "rehearsal_songs" 
      ADD CONSTRAINT "FK_rehearsal_songs_lead_singer" 
      FOREIGN KEY ("leadSingerId") REFERENCES "users"("id") ON DELETE SET NULL
    `);
    
    // First, change the column types to text to remove the enum dependency
    await queryRunner.query(`ALTER TABLE "rehearsal_songs" ALTER COLUMN "musicalKey" TYPE text`);
    await queryRunner.query(`ALTER TABLE "performance_songs" ALTER COLUMN "musicalKey" TYPE text`);
    
    // Update existing data back to the old format (assuming all data is now in simplified format)
    await queryRunner.query(`
      UPDATE "rehearsal_songs" 
      SET "musicalKey" = CASE 
        WHEN "musicalKey" = 'C' THEN 'C Major'
        WHEN "musicalKey" = 'G' THEN 'G Major'
        WHEN "musicalKey" = 'D' THEN 'D Major'
        WHEN "musicalKey" = 'A' THEN 'A Major'
        WHEN "musicalKey" = 'E' THEN 'E Major'
        WHEN "musicalKey" = 'B' THEN 'B Major'
        WHEN "musicalKey" = 'F#' THEN 'F# Major'
        WHEN "musicalKey" = 'C#' THEN 'C# Major'
        WHEN "musicalKey" = 'F' THEN 'F Major'
        WHEN "musicalKey" = 'G#' THEN 'G# Minor'
        WHEN "musicalKey" = 'D#' THEN 'D# Minor'
        WHEN "musicalKey" = 'A#' THEN 'A# Minor'
        ELSE "musicalKey"
      END
      WHERE "musicalKey" IS NOT NULL
    `);
    
    await queryRunner.query(`
      UPDATE "performance_songs" 
      SET "musicalKey" = CASE 
        WHEN "musicalKey" = 'C' THEN 'C Major'
        WHEN "musicalKey" = 'G' THEN 'G Major'
        WHEN "musicalKey" = 'D' THEN 'D Major'
        WHEN "musicalKey" = 'A' THEN 'A Major'
        WHEN "musicalKey" = 'E' THEN 'E Major'
        WHEN "musicalKey" = 'B' THEN 'B Major'
        WHEN "musicalKey" = 'F#' THEN 'F# Major'
        WHEN "musicalKey" = 'C#' THEN 'C# Major'
        WHEN "musicalKey" = 'F' THEN 'F Major'
        WHEN "musicalKey" = 'G#' THEN 'G# Minor'
        WHEN "musicalKey" = 'D#' THEN 'D# Minor'
        WHEN "musicalKey" = 'A#' THEN 'A# Minor'
        ELSE "musicalKey"
      END
      WHERE "musicalKey" IS NOT NULL
    `);
    
    // Drop the new musical key enum
    await queryRunner.query(`DROP TYPE "public"."musical_key_enum"`);
    
    // Recreate the old musical key enum
    await queryRunner.query(`
      CREATE TYPE "public"."musical_key_enum" AS ENUM('C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major', 'C# Major', 'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major', 'Cb Major', 'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor', 'D# Minor', 'A# Minor', 'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor', 'Ab Minor', 'Db Minor', 'Gb Minor', 'Cb Minor')
    `);
    
    // Change the columns back to use the old enum
    await queryRunner.query(`ALTER TABLE "rehearsal_songs" ALTER COLUMN "musicalKey" TYPE "public"."musical_key_enum" USING "musicalKey"::"public"."musical_key_enum"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" ALTER COLUMN "musicalKey" TYPE "public"."musical_key_enum" USING "musicalKey"::"public"."musical_key_enum"`);
  }
}
