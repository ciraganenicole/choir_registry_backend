import { MigrationInterface, QueryRunner } from "typeorm";

export class Schema1751613305872 implements MigrationInterface {
    name = 'Schema1751613305872'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."songs_difficulty_enum" AS ENUM('Easy', 'Intermediate', 'Advanced')`);
        await queryRunner.query(`CREATE TYPE "public"."songs_status_enum" AS ENUM('In Rehearsal', 'Active', 'Archived')`);
        await queryRunner.query(`CREATE TABLE "songs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "composer" character varying NOT NULL, "genre" character varying NOT NULL, "duration" character varying NOT NULL, "difficulty" "public"."songs_difficulty_enum" NOT NULL, "status" "public"."songs_status_enum" NOT NULL, "voice_parts" text array NOT NULL, "lyrics" text NOT NULL, "times_performed" integer NOT NULL DEFAULT '0', "last_performed" date, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "addedById" integer NOT NULL, CONSTRAINT "PK_e504ce8ad2e291d3a1d8f1ea2f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "role" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "songs" ADD CONSTRAINT "FK_d50c1dbd1799b31c4e107acd92a" FOREIGN KEY ("addedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "songs" DROP CONSTRAINT "FK_d50c1dbd1799b31c4e107acd92a"`);
        await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "role" SET DEFAULT 'CHOIR_ADMIN'`);
        await queryRunner.query(`ALTER TABLE "admin_users" ALTER COLUMN "role" SET NOT NULL`);
        await queryRunner.query(`DROP TABLE "songs"`);
        await queryRunner.query(`DROP TYPE "public"."songs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."songs_difficulty_enum"`);
    }

}
