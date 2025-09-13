import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSongsTables1754399300004 implements MigrationInterface {
  name = 'CreateSongsTables1754399300004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."song_difficulty_enum" AS ENUM('Easy', 'Intermediate', 'Advanced');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."song_status_enum" AS ENUM('In Rehearsal', 'Active', 'Archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."musical_key_enum" AS ENUM('C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major', 'C# Major', 'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major', 'Cb Major', 'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor', 'D# Minor', 'A# Minor', 'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor', 'Ab Minor', 'Db Minor', 'Gb Minor', 'Cb Minor');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."voice_part_type_enum" AS ENUM('Soprano', 'Alto', 'Tenor', 'Bass', 'Soprano 1', 'Soprano 2', 'Alto 1', 'Alto 2', 'Tenor 1', 'Tenor 2', 'Bass 1', 'Bass 2', 'Mezzo Soprano', 'Baritone', 'Other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."instrument_type_enum" AS ENUM('Piano', 'Organ', 'Keyboard', 'Synthesizer', 'Accordion', 'Piano Accompaniment', 'Guitar', 'Acoustic Guitar', 'Electric Guitar', 'Bass', 'Bass Guitar', 'Violin', 'Viola', 'Cello', 'Double Bass', 'Harp', 'Mandolin', 'Ukulele', 'Flute', 'Piccolo', 'Clarinet', 'Oboe', 'Bassoon', 'Trumpet', 'Trombone', 'French Horn', 'Saxophone', 'Alto Saxophone', 'Tenor Saxophone', 'Baritone Saxophone', 'Euphonium', 'Tuba', 'Drums', 'Drum Kit', 'Snare Drum', 'Bass Drum', 'Cymbals', 'Tambourine', 'Maracas', 'Congas', 'Bongo', 'Timpani', 'Xylophone', 'Glockenspiel', 'Chimes', 'Bells', 'Conga Drums', 'Bongo Drums', 'Harmonica', 'Kalimba', 'Recorder', 'Pan Flute', 'Didgeridoo', 'Other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create songs table
    await queryRunner.query(`
      CREATE TABLE "songs" (
        "id" SERIAL PRIMARY KEY,
        "title" character varying(255) NOT NULL,
        "composer" character varying(255) NOT NULL,
        "genre" character varying(100) NOT NULL,
        "duration" character varying(20) NOT NULL,
        "difficulty" "public"."song_difficulty_enum" NOT NULL,
        "status" "public"."song_status_enum" NOT NULL,
        "lyrics" text NOT NULL,
        "times_performed" integer NOT NULL DEFAULT 0,
        "last_performed" date,
        "addedById" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Add foreign key constraint to users table (if it exists)
    const usersTableExists = await queryRunner.hasTable('users');
    if (usersTableExists) {
      await queryRunner.query(`
        ALTER TABLE "songs"
        ADD CONSTRAINT "FK_songs_added_by"
        FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL
      `);
    }

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_songs_title" ON "songs" ("title")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_songs_composer" ON "songs" ("composer")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_songs_genre" ON "songs" ("genre")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_songs_difficulty" ON "songs" ("difficulty")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_songs_status" ON "songs" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_songs_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_songs_difficulty"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_songs_genre"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_songs_composer"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_songs_title"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "songs" DROP CONSTRAINT IF EXISTS "FK_songs_added_by"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "songs"`);

    // Note: We don't drop the enum types as they might be used by other tables
  }
}
