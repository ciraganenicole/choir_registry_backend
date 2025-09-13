import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePerformanceSongsTables1754399300005 implements MigrationInterface {
  name = 'CreatePerformanceSongsTables1754399300005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create performance_songs table
    await queryRunner.query(`
      CREATE TABLE "performance_songs" (
        "id" SERIAL PRIMARY KEY,
        "performanceId" integer NOT NULL,
        "songId" integer NOT NULL,
        "leadSingerId" integer,
        "notes" text,
        "order" integer NOT NULL DEFAULT 1,
        "timeAllocated" integer,
        "focusPoints" text,
        "musicalKey" "public"."musical_key_enum",
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create performance_song_musicians table
    await queryRunner.query(`
      CREATE TABLE "performance_song_musicians" (
        "id" SERIAL PRIMARY KEY,
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
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create performance_voice_parts table
    await queryRunner.query(`
      CREATE TABLE "performance_voice_parts" (
        "id" SERIAL PRIMARY KEY,
        "performanceSongId" integer NOT NULL,
        "type" "public"."voice_part_type_enum" NOT NULL,
        "needsWork" boolean NOT NULL DEFAULT false,
        "focusPoints" text,
        "notes" text,
        "order" integer NOT NULL DEFAULT 1,
        "timeAllocated" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create performance_voice_part_members junction table
    await queryRunner.query(`
      CREATE TABLE "performance_voice_part_members" (
        "performanceVoicePartId" integer NOT NULL,
        "userId" integer NOT NULL,
        CONSTRAINT "PK_performance_voice_part_members" PRIMARY KEY ("performanceVoicePartId", "userId")
      )
    `);

    // Add foreign key constraints (checking table existence first)
    const performancesTableExists = await queryRunner.hasTable('performances');
    const songsTableExists = await queryRunner.hasTable('songs');
    const usersTableExists = await queryRunner.hasTable('users');

    if (performancesTableExists) {
      await queryRunner.query(`
        ALTER TABLE "performance_songs"
        ADD CONSTRAINT "FK_performance_songs_performance"
        FOREIGN KEY ("performanceId") REFERENCES "performances"("id") ON DELETE CASCADE
      `);
    }

    if (songsTableExists) {
      await queryRunner.query(`
        ALTER TABLE "performance_songs"
        ADD CONSTRAINT "FK_performance_songs_song"
        FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE
      `);
    }

    if (usersTableExists) {
      await queryRunner.query(`
        ALTER TABLE "performance_songs"
        ADD CONSTRAINT "FK_performance_songs_lead_singer"
        FOREIGN KEY ("leadSingerId") REFERENCES "users"("id") ON DELETE SET NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "performance_song_musicians"
        ADD CONSTRAINT "FK_performance_song_musicians_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "performance_voice_part_members"
        ADD CONSTRAINT "FK_performance_voice_part_members_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      `);
    }

    // Add self-referencing constraints
    await queryRunner.query(`
      ALTER TABLE "performance_song_musicians"
      ADD CONSTRAINT "FK_performance_song_musicians_performance_song"
      FOREIGN KEY ("performanceSongId") REFERENCES "performance_songs"("id") ON DELETE CASCADE
    `);

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

    // Add indexes
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
    await queryRunner.query(`ALTER TABLE "performance_voice_part_members" DROP CONSTRAINT IF EXISTS "FK_performance_voice_part_members_voice_part"`);
    await queryRunner.query(`ALTER TABLE "performance_voice_parts" DROP CONSTRAINT IF EXISTS "FK_performance_voice_parts_performance_song"`);
    await queryRunner.query(`ALTER TABLE "performance_song_musicians" DROP CONSTRAINT IF EXISTS "FK_performance_song_musicians_performance_song"`);
    await queryRunner.query(`ALTER TABLE "performance_voice_part_members" DROP CONSTRAINT IF EXISTS "FK_performance_voice_part_members_user"`);
    await queryRunner.query(`ALTER TABLE "performance_song_musicians" DROP CONSTRAINT IF EXISTS "FK_performance_song_musicians_user"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT IF EXISTS "FK_performance_songs_lead_singer"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT IF EXISTS "FK_performance_songs_song"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT IF EXISTS "FK_performance_songs_performance"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_voice_part_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_voice_parts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_song_musicians"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "performance_songs"`);
  }
}
