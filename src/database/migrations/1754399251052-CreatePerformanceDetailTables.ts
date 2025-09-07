import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePerformanceDetailTables1754399251052 implements MigrationInterface {
  name = 'CreatePerformanceDetailTables1754399251052';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "performance_songs"
      ADD CONSTRAINT "FK_performance_songs_performance"
      FOREIGN KEY ("performanceId") REFERENCES "performances"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "performance_songs"
      ADD CONSTRAINT "FK_performance_songs_song"
      FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "performance_songs"
      ADD CONSTRAINT "FK_performance_songs_lead_singer"
      FOREIGN KEY ("leadSingerId") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "performance_song_musicians"
      ADD CONSTRAINT "FK_performance_song_musicians_performance_song"
      FOREIGN KEY ("performanceSongId") REFERENCES "performance_songs"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "performance_song_musicians"
      ADD CONSTRAINT "FK_performance_song_musicians_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
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

    await queryRunner.query(`
      ALTER TABLE "performance_voice_part_members"
      ADD CONSTRAINT "FK_performance_voice_part_members_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
    `);

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
    await queryRunner.query(`DROP INDEX "IDX_performance_voice_parts_performance_song_id"`);
    await queryRunner.query(`DROP INDEX "IDX_performance_song_musicians_performance_song_id"`);
    await queryRunner.query(`DROP INDEX "IDX_performance_songs_song_id"`);
    await queryRunner.query(`DROP INDEX "IDX_performance_songs_performance_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "performance_voice_part_members" DROP CONSTRAINT "FK_performance_voice_part_members_user"`);
    await queryRunner.query(`ALTER TABLE "performance_voice_part_members" DROP CONSTRAINT "FK_performance_voice_part_members_voice_part"`);
    await queryRunner.query(`ALTER TABLE "performance_voice_parts" DROP CONSTRAINT "FK_performance_voice_parts_performance_song"`);
    await queryRunner.query(`ALTER TABLE "performance_song_musicians" DROP CONSTRAINT "FK_performance_song_musicians_user"`);
    await queryRunner.query(`ALTER TABLE "performance_song_musicians" DROP CONSTRAINT "FK_performance_song_musicians_performance_song"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT "FK_performance_songs_lead_singer"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT "FK_performance_songs_song"`);
    await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT "FK_performance_songs_performance"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "performance_voice_part_members"`);
    await queryRunner.query(`DROP TABLE "performance_voice_parts"`);
    await queryRunner.query(`DROP TABLE "performance_song_musicians"`);
    await queryRunner.query(`DROP TABLE "performance_songs"`);
  }
}
