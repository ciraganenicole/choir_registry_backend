import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRehearsalSongsTables1754399300006 implements MigrationInterface {
  name = 'CreateRehearsalSongsTables1754399300006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create rehearsal_songs table
    await queryRunner.query(`
      CREATE TABLE "rehearsal_songs" (
        "id" SERIAL PRIMARY KEY,
        "rehearsalId" integer NOT NULL,
        "songId" integer NOT NULL,
        "leadSingerId" integer,
        "difficulty" "public"."song_difficulty_enum" NOT NULL DEFAULT 'Intermediate',
        "needsWork" boolean NOT NULL DEFAULT false,
        "order" integer NOT NULL DEFAULT 1,
        "timeAllocated" integer,
        "focusPoints" text,
        "notes" text,
        "musicalKey" "public"."musical_key_enum",
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create rehearsal_song_musicians table
    await queryRunner.query(`
      CREATE TABLE "rehearsal_song_musicians" (
        "id" SERIAL PRIMARY KEY,
        "rehearsalSongId" integer NOT NULL,
        "userId" integer NOT NULL,
        "musicianName" character varying(255),
        "instrument" "public"."instrument_type_enum" NOT NULL,
        "role" character varying(100),
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

    // Create rehearsal_voice_parts table
    await queryRunner.query(`
      CREATE TABLE "rehearsal_voice_parts" (
        "id" SERIAL PRIMARY KEY,
        "rehearsalSongId" integer NOT NULL,
        "voicePartType" "public"."voice_part_type_enum" NOT NULL,
        "needsWork" boolean NOT NULL DEFAULT false,
        "focusPoints" text,
        "notes" text,
        "order" integer NOT NULL DEFAULT 1,
        "timeAllocated" integer,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    // Create junction tables for many-to-many relationships
    await queryRunner.query(`
      CREATE TABLE "rehearsal_choir_members" (
        "rehearsalId" integer NOT NULL,
        "userId" integer NOT NULL,
        CONSTRAINT "PK_rehearsal_choir_members" PRIMARY KEY ("rehearsalId", "userId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "rehearsal_song_chorus_members" (
        "rehearsalSongId" integer NOT NULL,
        "userId" integer NOT NULL,
        CONSTRAINT "PK_rehearsal_song_chorus_members" PRIMARY KEY ("rehearsalSongId", "userId")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "rehearsal_voice_part_members" (
        "rehearsalVoicePartId" integer NOT NULL,
        "userId" integer NOT NULL,
        CONSTRAINT "PK_rehearsal_voice_part_members" PRIMARY KEY ("rehearsalVoicePartId", "userId")
      )
    `);

    // Add foreign key constraints (checking table existence first)
    const rehearsalsTableExists = await queryRunner.hasTable('rehearsals');
    const songsTableExists = await queryRunner.hasTable('songs');
    const usersTableExists = await queryRunner.hasTable('users');

    if (rehearsalsTableExists) {
      await queryRunner.query(`
        ALTER TABLE "rehearsal_songs"
        ADD CONSTRAINT "FK_rehearsal_songs_rehearsal"
        FOREIGN KEY ("rehearsalId") REFERENCES "rehearsals"("id") ON DELETE CASCADE
      `);

      await queryRunner.query(`
        ALTER TABLE "rehearsal_choir_members"
        ADD CONSTRAINT "FK_rehearsal_choir_members_rehearsal"
        FOREIGN KEY ("rehearsalId") REFERENCES "rehearsals"("id") ON DELETE CASCADE
      `);
    }

    if (songsTableExists) {
      await queryRunner.query(`
        ALTER TABLE "rehearsal_songs"
        ADD CONSTRAINT "FK_rehearsal_songs_song"
        FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE
      `);
    }

    if (usersTableExists) {
      await queryRunner.query(`
        ALTER TABLE "rehearsal_songs"
        ADD CONSTRAINT "FK_rehearsal_songs_lead_singer"
        FOREIGN KEY ("leadSingerId") REFERENCES "users"("id") ON DELETE SET NULL
      `);

      await queryRunner.query(`
        ALTER TABLE "rehearsal_song_musicians"
        ADD CONSTRAINT "FK_rehearsal_song_musicians_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      `);

      await queryRunner.query(`
        ALTER TABLE "rehearsal_choir_members"
        ADD CONSTRAINT "FK_rehearsal_choir_members_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      `);

      await queryRunner.query(`
        ALTER TABLE "rehearsal_song_chorus_members"
        ADD CONSTRAINT "FK_rehearsal_song_chorus_members_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      `);

      await queryRunner.query(`
        ALTER TABLE "rehearsal_voice_part_members"
        ADD CONSTRAINT "FK_rehearsal_voice_part_members_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      `);
    }

    // Add self-referencing constraints
    await queryRunner.query(`
      ALTER TABLE "rehearsal_song_musicians"
      ADD CONSTRAINT "FK_rehearsal_song_musicians_rehearsal_song"
      FOREIGN KEY ("rehearsalSongId") REFERENCES "rehearsal_songs"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "rehearsal_voice_parts"
      ADD CONSTRAINT "FK_rehearsal_voice_parts_rehearsal_song"
      FOREIGN KEY ("rehearsalSongId") REFERENCES "rehearsal_songs"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "rehearsal_song_chorus_members"
      ADD CONSTRAINT "FK_rehearsal_song_chorus_members_rehearsal_song"
      FOREIGN KEY ("rehearsalSongId") REFERENCES "rehearsal_songs"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "rehearsal_voice_part_members"
      ADD CONSTRAINT "FK_rehearsal_voice_part_members_rehearsalVoicePart"
      FOREIGN KEY ("rehearsalVoicePartId") REFERENCES "rehearsal_voice_parts"("id") ON DELETE CASCADE
    `);

    // Add indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_rehearsal_songs_rehearsal_id" ON "rehearsal_songs" ("rehearsalId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rehearsal_songs_song_id" ON "rehearsal_songs" ("songId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rehearsal_song_musicians_rehearsal_song_id" ON "rehearsal_song_musicians" ("rehearsalSongId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_rehearsal_voice_parts_rehearsal_song_id" ON "rehearsal_voice_parts" ("rehearsalSongId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsal_voice_parts_rehearsal_song_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsal_song_musicians_rehearsal_song_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsal_songs_song_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsal_songs_rehearsal_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "rehearsal_voice_part_members" DROP CONSTRAINT IF EXISTS "FK_rehearsal_voice_part_members_rehearsalVoicePart"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_song_chorus_members" DROP CONSTRAINT IF EXISTS "FK_rehearsal_song_chorus_members_rehearsal_song"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_voice_parts" DROP CONSTRAINT IF EXISTS "FK_rehearsal_voice_parts_rehearsal_song"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_song_musicians" DROP CONSTRAINT IF EXISTS "FK_rehearsal_song_musicians_rehearsal_song"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_voice_part_members" DROP CONSTRAINT IF EXISTS "FK_rehearsal_voice_part_members_user"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_song_chorus_members" DROP CONSTRAINT IF EXISTS "FK_rehearsal_song_chorus_members_user"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_choir_members" DROP CONSTRAINT IF EXISTS "FK_rehearsal_choir_members_user"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_song_musicians" DROP CONSTRAINT IF EXISTS "FK_rehearsal_song_musicians_user"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_songs" DROP CONSTRAINT IF EXISTS "FK_rehearsal_songs_lead_singer"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_songs" DROP CONSTRAINT IF EXISTS "FK_rehearsal_songs_song"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_choir_members" DROP CONSTRAINT IF EXISTS "FK_rehearsal_choir_members_rehearsal"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_songs" DROP CONSTRAINT IF EXISTS "FK_rehearsal_songs_rehearsal"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "rehearsal_voice_part_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rehearsal_song_chorus_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rehearsal_choir_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rehearsal_voice_parts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rehearsal_song_musicians"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rehearsal_songs"`);
  }
}
