import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1740650696721 implements MigrationInterface {
    name = 'CreateTables1740650696721'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."event_type_enum" AS ENUM('NORMAL', 'LOUADO', 'ADMINISTRATION', 'MUSIC', 'SPECIAL')`);
        await queryRunner.query(`CREATE TABLE "event" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "type" "public"."event_type_enum" NOT NULL, "category" character varying, "date" date NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."attendance_status_enum" AS ENUM('present', 'absent', 'late')`);
        await queryRunner.query(`CREATE TABLE "attendance" ("id" SERIAL NOT NULL, "status" "public"."attendance_status_enum" NOT NULL DEFAULT 'absent', "justified" boolean NOT NULL DEFAULT false, "userId" integer, "eventId" integer, CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."leave_leavetype_enum" AS ENUM('sick', 'vacation', 'personal', 'suspension', 'work', 'other')`);
        await queryRunner.query(`CREATE TABLE "leave" ("id" SERIAL NOT NULL, "startDate" date NOT NULL, "endDate" date, "leaveType" "public"."leave_leavetype_enum" NOT NULL DEFAULT 'other', "approved" boolean NOT NULL DEFAULT false, "rejected" boolean NOT NULL DEFAULT false, "userId" integer, CONSTRAINT "PK_501f6ea368365d2a40b1660e16b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "surname" character varying NOT NULL, "matricule" character varying NOT NULL,"phoneNumber" character varying NOT NULL, "categories" text array NOT NULL DEFAULT '{}', "fingerprintData" character varying, "voiceCategory" character varying NOT NULL, "joinDate" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293" UNIQUE ("phoneNumber"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."admin_users_role_enum" AS ENUM('SUPER_ADMIN', 'CHOIR_ADMIN', 'LOUADO_ADMIN', 'ADMINISTRATION_ADMIN', 'CAISSE_ADMIN')`);
        await queryRunner.query(`CREATE TABLE "admin_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."admin_users_role_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_dcd0c8a4b10af9c986e510b9ecc" UNIQUE ("email"), CONSTRAINT "PK_06744d221bb6145dc61e5dc441d" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`CREATE TABLE "transactions" ("id" SERIAL NOT NULL, "userId" integer, "fullname" character varying NOT NULL, "amount" decimal NOT NULL, "category" character varying NOT NULL, "subcategory" character varying, "date" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_466e85b813d871bfb693f443528" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_f89c5a18dbf866ba8b1e4a9b8e9" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leave" ADD CONSTRAINT "FK_9fb20081bf48840a16e0d33d14e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_9fb20081bf48840a16e0d33d14e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_9fb20081bf48840a16e0d33d14e"`);
        await queryRunner.query(`ALTER TABLE "leave" DROP CONSTRAINT "FK_9fb20081bf48840a16e0d33d14e"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_f89c5a18dbf866ba8b1e4a9b8e9"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_466e85b813d871bfb693f443528"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "admin_users"`);
        await queryRunner.query(`DROP TYPE "public"."admin_users_role_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "leave"`);
        await queryRunner.query(`DROP TYPE "public"."leave_leavetype_enum"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TYPE "public"."attendance_status_enum"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TYPE "public"."event_type_enum"`);
    }
}
