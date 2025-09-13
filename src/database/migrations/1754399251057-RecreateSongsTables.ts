import { MigrationInterface, QueryRunner } from "typeorm";

export class RecreateSongsTables1754399251057 implements MigrationInterface {
    name = 'RecreateSongsTables1754399251057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums only if they don't exist (using DO block to handle existing types)
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

        // Create rehearsals table
        await queryRunner.query(`
            CREATE TABLE "rehearsals" (
                "id" SERIAL PRIMARY KEY,
                "title" character varying(255) NOT NULL,
                "date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "type" character varying(50) NOT NULL DEFAULT 'General Practice',
                "status" character varying(50) NOT NULL DEFAULT 'Planning',
                "location" character varying(255),
                "duration" integer,
                "performanceId" integer,
                "rehearsalLeadId" integer,
                "shiftLeadId" integer,
                "isTemplate" boolean NOT NULL DEFAULT false,
                "notes" text,
                "objectives" text,
                "feedback" text,
                "createdById" integer,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            )
        `);

        // Create performances table
        await queryRunner.query(`
            CREATE TABLE "performances" (
                "id" SERIAL PRIMARY KEY,
                "date" TIMESTAMP WITH TIME ZONE NOT NULL,
                "location" character varying(255),
                "expectedAudience" integer,
                "type" character varying(50) NOT NULL DEFAULT 'Concert',
                "shiftLeadId" integer NOT NULL,
                "notes" text,
                "status" character varying(50) NOT NULL DEFAULT 'upcoming',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            )
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
                "voice_parts" text array NOT NULL,
                "lyrics" text NOT NULL,
                "times_performed" integer NOT NULL DEFAULT 0,
                "last_performed" date,
                "addedById" integer,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            )
        `);

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

        // Create performance_songs table (only if it doesn't exist)
        try {
            await queryRunner.query(`
                CREATE TABLE "performance_songs" (
                    "id" SERIAL PRIMARY KEY,
                    "performanceId" integer NOT NULL,
                    "songId" integer NOT NULL,
                    "leadSingerId" integer,
                    "order" integer NOT NULL DEFAULT 1,
                    "timeAllocated" integer,
                    "focusPoints" text,
                    "notes" text,
                    "musicalKey" "public"."musical_key_enum",
                    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
                )
            `);
        } catch (error) {
            console.warn('performance_songs table already exists, skipping creation');
        }

        // Create performance_song_musicians table (only if it doesn't exist)
        try {
            await queryRunner.query(`
                CREATE TABLE "performance_song_musicians" (
                    "id" SERIAL PRIMARY KEY,
                    "performanceSongId" integer NOT NULL,
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
        } catch (error) {
            console.warn('performance_song_musicians table already exists, skipping creation');
        }

        // Create performance_voice_parts table (only if it doesn't exist)
        try {
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
        } catch (error) {
            console.warn('performance_voice_parts table already exists, skipping creation');
        }

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

        try {
            await queryRunner.query(`
                CREATE TABLE "performance_voice_part_members" (
                    "performanceVoicePartId" integer NOT NULL,
                    "userId" integer NOT NULL,
                    CONSTRAINT "PK_performance_voice_part_members" PRIMARY KEY ("performanceVoicePartId", "userId")
                )
            `);
        } catch (error) {
            console.warn('performance_voice_part_members table already exists, skipping creation');
        }

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "rehearsals" ADD CONSTRAINT "FK_rehearsals_performance" FOREIGN KEY ("performanceId") REFERENCES "performances"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rehearsals" ADD CONSTRAINT "FK_rehearsals_rehearsal_lead" FOREIGN KEY ("rehearsalLeadId") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "rehearsals" ADD CONSTRAINT "FK_rehearsals_shift_lead" FOREIGN KEY ("shiftLeadId") REFERENCES "users"("id") ON DELETE SET NULL`);
        await queryRunner.query(`ALTER TABLE "rehearsals" ADD CONSTRAINT "FK_rehearsals_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "performances" ADD CONSTRAINT "FK_performances_shift_lead" FOREIGN KEY ("shiftLeadId") REFERENCES "users"("id") ON DELETE NO ACTION`);
        
        await queryRunner.query(`ALTER TABLE "songs" ADD CONSTRAINT "FK_songs_added_by" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE SET NULL`);
        
        await queryRunner.query(`ALTER TABLE "rehearsal_songs" ADD CONSTRAINT "FK_rehearsal_songs_rehearsal" FOREIGN KEY ("rehearsalId") REFERENCES "rehearsals"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rehearsal_songs" ADD CONSTRAINT "FK_rehearsal_songs_song" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rehearsal_songs" ADD CONSTRAINT "FK_rehearsal_songs_lead_singer" FOREIGN KEY ("leadSingerId") REFERENCES "users"("id") ON DELETE SET NULL`);
        
        await queryRunner.query(`ALTER TABLE "rehearsal_song_musicians" ADD CONSTRAINT "FK_rehearsal_song_musicians_rehearsal_song" FOREIGN KEY ("rehearsalSongId") REFERENCES "rehearsal_songs"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rehearsal_song_musicians" ADD CONSTRAINT "FK_rehearsal_song_musicians_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        
        await queryRunner.query(`ALTER TABLE "rehearsal_voice_parts" ADD CONSTRAINT "FK_rehearsal_voice_parts_rehearsal_song" FOREIGN KEY ("rehearsalSongId") REFERENCES "rehearsal_songs"("id") ON DELETE CASCADE`);
        
        await queryRunner.query(`ALTER TABLE "performance_songs" ADD CONSTRAINT "FK_performance_songs_performance" FOREIGN KEY ("performanceId") REFERENCES "performances"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "performance_songs" ADD CONSTRAINT "FK_performance_songs_song" FOREIGN KEY ("songId") REFERENCES "songs"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "performance_songs" ADD CONSTRAINT "FK_performance_songs_lead_singer" FOREIGN KEY ("leadSingerId") REFERENCES "users"("id") ON DELETE SET NULL`);
        
        await queryRunner.query(`ALTER TABLE "performance_song_musicians" ADD CONSTRAINT "FK_performance_song_musicians_performance_song" FOREIGN KEY ("performanceSongId") REFERENCES "performance_songs"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "performance_song_musicians" ADD CONSTRAINT "FK_performance_song_musicians_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        
        await queryRunner.query(`ALTER TABLE "performance_voice_parts" ADD CONSTRAINT "FK_performance_voice_parts_performance_song" FOREIGN KEY ("performanceSongId") REFERENCES "performance_songs"("id") ON DELETE CASCADE`);
        
        // Add foreign key constraints for junction tables
        await queryRunner.query(`ALTER TABLE "rehearsal_choir_members" ADD CONSTRAINT "FK_rehearsal_choir_members_rehearsal" FOREIGN KEY ("rehearsalId") REFERENCES "rehearsals"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rehearsal_choir_members" ADD CONSTRAINT "FK_rehearsal_choir_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        
        await queryRunner.query(`ALTER TABLE "rehearsal_song_chorus_members" ADD CONSTRAINT "FK_rehearsal_song_chorus_members_rehearsal_song" FOREIGN KEY ("rehearsalSongId") REFERENCES "rehearsal_songs"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rehearsal_song_chorus_members" ADD CONSTRAINT "FK_rehearsal_song_chorus_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        
        await queryRunner.query(`ALTER TABLE "rehearsal_voice_part_members" ADD CONSTRAINT "FK_rehearsal_voice_part_members_rehearsalVoicePart" FOREIGN KEY ("rehearsalVoicePartId") REFERENCES "rehearsal_voice_parts"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "rehearsal_voice_part_members" ADD CONSTRAINT "FK_rehearsal_voice_part_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
        
        await queryRunner.query(`ALTER TABLE "performance_voice_part_members" ADD CONSTRAINT "FK_performance_voice_part_members_performanceVoicePart" FOREIGN KEY ("performanceVoicePartId") REFERENCES "performance_voice_parts"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "performance_voice_part_members" ADD CONSTRAINT "FK_performance_voice_part_members_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`ALTER TABLE "performance_voice_parts" DROP CONSTRAINT "FK_performance_voice_parts_performance_song"`);
        await queryRunner.query(`ALTER TABLE "performance_song_musicians" DROP CONSTRAINT "FK_performance_song_musicians_user"`);
        await queryRunner.query(`ALTER TABLE "performance_song_musicians" DROP CONSTRAINT "FK_performance_song_musicians_performance_song"`);
        await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT "FK_performance_songs_lead_singer"`);
        await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT "FK_performance_songs_song"`);
        await queryRunner.query(`ALTER TABLE "performance_songs" DROP CONSTRAINT "FK_performance_songs_performance"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_voice_parts" DROP CONSTRAINT "FK_rehearsal_voice_parts_rehearsal_song"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_song_musicians" DROP CONSTRAINT "FK_rehearsal_song_musicians_user"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_song_musicians" DROP CONSTRAINT "FK_rehearsal_song_musicians_rehearsal_song"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_songs" DROP CONSTRAINT "FK_rehearsal_songs_lead_singer"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_songs" DROP CONSTRAINT "FK_rehearsal_songs_song"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_songs" DROP CONSTRAINT "FK_rehearsal_songs_rehearsal"`);
        await queryRunner.query(`ALTER TABLE "rehearsals" DROP CONSTRAINT "FK_rehearsals_created_by"`);
        await queryRunner.query(`ALTER TABLE "rehearsals" DROP CONSTRAINT "FK_rehearsals_shift_lead"`);
        await queryRunner.query(`ALTER TABLE "rehearsals" DROP CONSTRAINT "FK_rehearsals_rehearsal_lead"`);
        await queryRunner.query(`ALTER TABLE "rehearsals" DROP CONSTRAINT "FK_rehearsals_performance"`);
        await queryRunner.query(`ALTER TABLE "performances" DROP CONSTRAINT "FK_performances_shift_lead"`);
        await queryRunner.query(`ALTER TABLE "songs" DROP CONSTRAINT "FK_songs_added_by"`);
        
        // Drop junction table constraints
        await queryRunner.query(`ALTER TABLE "performance_voice_part_members" DROP CONSTRAINT "FK_performance_voice_part_members_user"`);
        await queryRunner.query(`ALTER TABLE "performance_voice_part_members" DROP CONSTRAINT "FK_performance_voice_part_members_performanceVoicePart"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_voice_part_members" DROP CONSTRAINT "FK_rehearsal_voice_part_members_user"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_voice_part_members" DROP CONSTRAINT "FK_rehearsal_voice_part_members_rehearsalVoicePart"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_song_chorus_members" DROP CONSTRAINT "FK_rehearsal_song_chorus_members_user"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_song_chorus_members" DROP CONSTRAINT "FK_rehearsal_song_chorus_members_rehearsal_song"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_choir_members" DROP CONSTRAINT "FK_rehearsal_choir_members_user"`);
        await queryRunner.query(`ALTER TABLE "rehearsal_choir_members" DROP CONSTRAINT "FK_rehearsal_choir_members_rehearsal"`);

        // Drop tables in correct order (dependent tables first)
        await queryRunner.query(`DROP TABLE "performance_voice_part_members"`);
        await queryRunner.query(`DROP TABLE "performance_voice_parts"`);
        await queryRunner.query(`DROP TABLE "performance_song_musicians"`);
        await queryRunner.query(`DROP TABLE "performance_songs"`);
        await queryRunner.query(`DROP TABLE "rehearsal_voice_part_members"`);
        await queryRunner.query(`DROP TABLE "rehearsal_voice_parts"`);
        await queryRunner.query(`DROP TABLE "rehearsal_song_chorus_members"`);
        await queryRunner.query(`DROP TABLE "rehearsal_song_musicians"`);
        await queryRunner.query(`DROP TABLE "rehearsal_choir_members"`);
        await queryRunner.query(`DROP TABLE "rehearsal_songs"`);
        await queryRunner.query(`DROP TABLE "performances"`);
        await queryRunner.query(`DROP TABLE "rehearsals"`);
        await queryRunner.query(`DROP TABLE "songs"`);

        // Note: Don't drop the enum types as they might be used by other tables
    }
}
