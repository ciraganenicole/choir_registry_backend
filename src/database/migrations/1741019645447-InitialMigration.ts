import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1741019645447 implements MigrationInterface {
    name = 'InitialMigration1741019645447'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."events_type_enum" AS ENUM('NORMAL', 'WORSHIPPER', 'COMMITTEE', 'MUSIC', 'SUNDAY_SERVICE', 'SPECIAL')`);
        await queryRunner.query(`CREATE TYPE "public"."events_category_enum" AS ENUM('WORSHIPPER', 'COMMITTEE')`);
        await queryRunner.query(`CREATE TABLE "events" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "type" "public"."events_type_enum" NOT NULL, "category" "public"."events_category_enum", "date" date NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."attendance_status_enum" AS ENUM('present', 'absent', 'late')`);
        await queryRunner.query(`CREATE TABLE "attendance" ("id" SERIAL NOT NULL, "status" "public"."attendance_status_enum" NOT NULL DEFAULT 'absent', "justified" boolean NOT NULL DEFAULT false, "userId" integer, "eventId" integer, CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."leave_leavetype_enum" AS ENUM('sick', 'vacation', 'personal', 'suspension', 'work', 'other')`);
        await queryRunner.query(`CREATE TABLE "leave" ("id" SERIAL NOT NULL, "startDate" date NOT NULL, "endDate" date, "leaveType" "public"."leave_leavetype_enum" NOT NULL DEFAULT 'other', "approved" boolean NOT NULL DEFAULT false, "rejected" boolean NOT NULL DEFAULT false, "userId" integer, CONSTRAINT "PK_501f6ea368365d2a40b1660e16b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_gender_enum" AS ENUM('F', 'M')`);
        await queryRunner.query(`CREATE TYPE "public"."users_maritalstatus_enum" AS ENUM('CELIBATAIRE', 'MARIE(E)', 'VEUF(VE)', 'DIVORCE(E)')`);
        await queryRunner.query(`CREATE TYPE "public"."users_educationlevel_enum" AS ENUM('N/A', 'CERTIFICAT', 'A3', 'A2', 'HUMANITE_INCOMPLETE', 'DIPLOME_ETAT', 'GRADUE', 'LICENCIE', 'MASTER', 'DOCTEUR')`);
        await queryRunner.query(`CREATE TYPE "public"."users_profession_enum" AS ENUM('LIBERAL', 'FONCTIONNAIRE', 'AGENT_ONG', 'SANS_EMPLOI')`);
        await queryRunner.query(`CREATE TYPE "public"."users_commune_enum" AS ENUM('GOMA', 'KARISIMBI')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "gender" "public"."users_gender_enum" NOT NULL, "maritalStatus" "public"."users_maritalstatus_enum" NOT NULL, "educationLevel" "public"."users_educationlevel_enum" NOT NULL, "profession" "public"."users_profession_enum" NOT NULL, "competenceDomain" character varying, "churchOfOrigin" character varying NOT NULL, "commune" "public"."users_commune_enum" NOT NULL, "quarter" character varying NOT NULL, "reference" character varying NOT NULL, "address" character varying NOT NULL, "phoneNumber" character varying NOT NULL, "whatsappNumber" character varying, "email" character varying NOT NULL, "phone" character varying, "commissions" text array NOT NULL DEFAULT '{}', "matricule" character varying, "categories" text array NOT NULL DEFAULT '{}', "fingerprintData" character varying, "voiceCategory" character varying, "joinDate" TIMESTAMP, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293" UNIQUE ("phoneNumber"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."admin_users_role_enum" AS ENUM('SUPER_ADMIN', 'CHOIR_ADMIN', 'LOUADO_ADMIN', 'ADMINISTRATION_ADMIN', 'CAISSE_ADMIN')`);
        await queryRunner.query(`CREATE TABLE "admin_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."admin_users_role_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_dcd0c8a4b10af9c986e510b9ecc" UNIQUE ("email"), CONSTRAINT "PK_06744d221bb6145dc61e5dc441d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('INCOME', 'EXPENSE')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_category_enum" AS ENUM('DAILY', 'DONATION', 'SPECIAL', 'OTHER', 'CHARITY', 'MAINTENANCE', 'TRANSPORT', 'SPECIAL_ASSISTANCE', 'COMMUNICATION', 'RESTAURATION')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" SERIAL NOT NULL, "amount" integer NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "category" "public"."transactions_category_enum" NOT NULL, "subcategory" character varying, "description" character varying, "transactionDate" date NOT NULL, "externalContributorName" character varying, "externalContributorPhone" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contributorId" integer, CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_466e85b813d871bfb693f443528" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_f89c5a18dbf866ba8b1e4a9b8e9" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "leave" ADD CONSTRAINT "FK_9fb20081bf48840a16e0d33d14e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_c09a5bbc23ffa6bb6f61b5f0418" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_c09a5bbc23ffa6bb6f61b5f0418"`);
        await queryRunner.query(`ALTER TABLE "leave" DROP CONSTRAINT "FK_9fb20081bf48840a16e0d33d14e"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_f89c5a18dbf866ba8b1e4a9b8e9"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_466e85b813d871bfb693f443528"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "admin_users"`);
        await queryRunner.query(`DROP TYPE "public"."admin_users_role_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_commune_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_profession_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_educationlevel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_maritalstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
        await queryRunner.query(`DROP TABLE "leave"`);
        await queryRunner.query(`DROP TYPE "public"."leave_leavetype_enum"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TYPE "public"."attendance_status_enum"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TYPE "public"."events_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."events_type_enum"`);
    }

}
