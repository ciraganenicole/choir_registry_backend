import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePerformanceDetailTables1754399251052 implements MigrationInterface {
  name = 'CreatePerformanceDetailTables1754399251052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if required enums exist, if not create them
    let instrumentEnumExists = false;
    let voicePartEnumExists = false;
    
    try {
      await queryRunner.query(`SELECT 1 FROM pg_type WHERE typname = 'instrument_type_enum'`);
      instrumentEnumExists = true;
    } catch (error) {
      // Enum doesn't exist, will create it
    }
    
    try {
      await queryRunner.query(`SELECT 1 FROM pg_type WHERE typname = 'voice_part_type_enum'`);
      voicePartEnumExists = true;
    } catch (error) {
      // Enum doesn't exist, will create it
    }
    
    if (!instrumentEnumExists) {
      await queryRunner.query(`
        CREATE TYPE "public"."instrument_type_enum" AS ENUM(
          'Piano', 'Organ', 'Keyboard', 'Synthesizer', 'Accordion', 'Piano Accompaniment',
          'Guitar', 'Acoustic Guitar', 'Electric Guitar', 'Bass', 'Bass Guitar',
          'Violin', 'Viola', 'Cello', 'Double Bass', 'Harp', 'Mandolin', 'Ukulele',
          'Flute', 'Piccolo', 'Clarinet', 'Oboe', 'Bassoon', 'Trumpet', 'Trombone',
          'French Horn', 'Saxophone', 'Alto Saxophone', 'Tenor Saxophone', 'Baritone Saxophone',
          'Euphonium', 'Tuba', 'Drums', 'Drum Kit', 'Snare Drum', 'Bass Drum', 'Cymbals',
          'Tambourine', 'Maracas', 'Congas', 'Bongo', 'Timpani', 'Xylophone', 'Glockenspiel',
          'Chimes', 'Bells', 'Conga Drums', 'Bongo Drums', 'Harmonica', 'Kalimba',
          'Recorder', 'Pan Flute', 'Didgeridoo', 'Other'
        )
      `);
    }
    
    if (!voicePartEnumExists) {
      await queryRunner.query(`
        CREATE TYPE "public"."voice_part_type_enum" AS ENUM(
          'Soprano', 'Alto', 'Tenor', 'Bass', 'Soprano 1', 'Soprano 2',
          'Alto 1', 'Alto 2', 'Tenor 1', 'Tenor 2', 'Bass 1', 'Bass 2',
          'Mezzo Soprano', 'Baritone', 'Other'
        )
      `);
    }

    // Create performance songs table
    await queryRunner.query(`
      CREATE TABLE "performance_songs" (
        "id" SERIAL NOT NULL,
        "performanceId" integer NOT NULL,
        "songId" integer NOT NULL,
        "leadSingerId" integer,
        "notes" text,
        "order" integer NOT NULL DEFAULT 1,
        "timeAllocated" integer,
        "focusPoints" text,
        "musicalKey" character varying,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performance_songs" PRIMARY KEY ("id")
      )
    `);

    // Create performance song musicians table
    await queryRunner.query(`
      CREATE TABLE "performance_song_musicians" (
        "id" SERIAL NOT NULL,
        "performanceSongId" integer NOT NULL,
        "userId" integer,
        "musicianName" character varying(255),
        "role" character varying(100),
        "instrument" "public"."instrument_type_enum" NOT NULL,
        "notes" text,
        "practiceNotes" text,
        "needsPractice" boolean NOT NULL DEFAULT false,
        "isSoloist" boolean NOT NULL DEFAULT false,
        "isAccompanist" boolean NOT NULL DEFAULT false,
        "soloStartTime" integer,
        "soloEndTime" integer,
        "soloNotes" text,
        "accompanimentNotes" text,
        "order" integer NOT NULL DEFAULT 1,
        "timeAllocated" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performance_song_musicians" PRIMARY KEY ("id")
      )
    `);

    // Create performance voice parts table
    await queryRunner.query(`
      CREATE TABLE "performance_voice_parts" (
        "id" SERIAL NOT NULL,
        "performanceSongId" integer NOT NULL,
        "type" "public"."voice_part_type_enum" NOT NULL,
        "needsWork" boolean NOT NULL DEFAULT false,
        "focusPoints" text,
        "notes" text,
        "order" integer NOT NULL DEFAULT 1,
        "timeAllocated" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_performance_voice_parts" PRIMARY KEY ("id")
      )
    `);

    // Create performance voice part members junction table
    await queryRunner.query(`
      CREATE TABLE "performance_voice_part_members" (
        "performanceVoicePartId" integer NOT NULL,
        "userId" integer NOT NULL,
        CONSTRAINT "PK_performance_voice_part_members" PRIMARY KEY ("performanceVoicePartId", "userId")
      )
    `);

    // Add foreign key constraints (with error handling)
    try {
      await queryRunner.query(`
        ALTER TABLE "performance_songs"
        ADD CONSTRAINT "FK_performance_songs_performance"
        FOREIGN KEY ("performanceId") REFERENCES "performances"("id") ON DELETE CASCADE
      `);
    } catch (error) {
      console.warn('Performance table might not exist yet:', (error as Error).message);
    }

    try {
      await queryRunner.query(`
        ALTER TABLE "performance_songs"
        ADD CONSTRAINT "FK_performance_songs_song"
        FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE
      `);
    } catch (error) {
      console.warn('Songs table does not exist yet - this constraint will be added later by the songs migration:', (error as Error).message);
      // Note: The songs table is created in migration 1754399251057-RecreateSongsTables.ts
      // The foreign key constraint will need to be added after that migration runs
    }

    try {
      await queryRunner.query(`
        ALTER TABLE "performance_songs"
        ADD CONSTRAINT "FK_performance_songs_lead_singer"
        FOREIGN KEY ("leadSingerId") REFERENCES "users"("id") ON DELETE SET NULL
      `);
    } catch (error) {
      console.warn('Users table might not exist yet:', (error as Error).message);
    }

    await queryRunner.query(`
      ALTER TABLE "performance_song_musicians"
      ADD CONSTRAINT "FK_performance_song_musicians_performance_song"
      FOREIGN KEY ("performanceSongId") REFERENCES "performance_songs"("id") ON DELETE CASCADE
    `);

    try {
      await queryRunner.query(`
        ALTER TABLE "performance_song_musicians"
        ADD CONSTRAINT "FK_performance_song_musicians_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      `);
    } catch (error) {
      console.warn('Users table might not exist yet:', (error as Error).message);
    }

    await queryRunner.query(`
      ALTER TABLE "performance_voice_parts"
      ADD CONSTRAINT "FK_performance_voice_parts_performance_song"
      FOREIGN KEY ("performanceSongId") REFERENCES "performance_songs"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "performance_voice_part_members"
      ADD CONSTRAINT "FK_performance_voice_part_members_voice_part"
      FOREIGN KEY ("performanceVoicePartId") REFERENCES "performance_voice_parts"("id") ON DELETE CASCADE
    `);

    try {
      await queryRunner.query(`
        ALTER TABLE "performance_voice_part_members"
        ADD CONSTRAINT "FK_performance_voice_part_members_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      `);
    } catch (error) {
      console.warn('Users table might not exist yet:', (error as Error).message);
    }

    // Add indexes for better performance
    await queryRunner.query(`
      CREATE INDEX "IDX_performance_songs_performance_id" ON "performance_songs" ("performanceId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_performance_songs_song_id" ON "performance_songs" ("songId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_performance_song_musicians_performance_song_id" ON "performance_song_musicians" ("performanceSongId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_performance_voice_parts_performance_song_id" ON "performance_voice_parts" ("performanceSongId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_performance_voice_parts_performance_song_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_performance_song_musicians_performance_song_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_performance_songs_song_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_performance_songs_performance_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "performance_voice_part_members" DROP CONSTRAINT IF EXISTS "FK_performance_voice_part_members_user"`);
    await queryRunner.query(`ALTER TABLE "performance_voice_part_members" DROP CONSTRAINT IF EXISTS "FK_performance_voice_part_members_voice_part"`);
    await queryRunner.query(`ALTER TABLE "performance_voice_parts" DROP CONSTRAINT IF EXISTS "FK_performance_voice_parts_performance_song"`);
    await queryRunner.query(`ALTER TABLE "performance_song_musicians" DROP CONSTRAINT IF EXISTS "FK_performance_song_musicians_user"`);
    await queryRunner.query(`ALTER TABLE "performance_song_musicians" DROP CONSTRAINT IF EXISTS "FK_performance_song_musicians_performance_song"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT IF EXISTS "FK_performance_songs_lead_singer"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT IF EXISTS "FK_performance_songs_song"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT IF EXISTS "FK_performance_songs_performance"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_voice_part_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_voice_parts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_song_musicians"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_songs"`);

    // Drop enums if they exist (only if they were created by this migration)
    // Note: We don't drop enums here because they might be used by other tables
    // The enum cleanup should be handled by the migration that created them
  }
}
