import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1741018850068 implements MigrationInterface {
    name = 'InitialMigration1741018850068'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums first
        await queryRunner.query(`CREATE TYPE "public"."gender_enum" AS ENUM('MALE', 'FEMALE')`);
        await queryRunner.query(`CREATE TYPE "public"."marital_status_enum" AS ENUM('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED')`);
        await queryRunner.query(`CREATE TYPE "public"."education_level_enum" AS ENUM('PRIMARY', 'SECONDARY', 'UNIVERSITY', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."profession_enum" AS ENUM('STUDENT', 'EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED')`);
        await queryRunner.query(`CREATE TYPE "public"."commune_enum" AS ENUM('NGALIEMA', 'GOMBE', 'BARUMBU', 'KINSHASA', 'KINTAMBO', 'LINGWALA', 'BANDALUNGWA')`);
        await queryRunner.query(`CREATE TYPE "public"."event_type_enum" AS ENUM('NORMAL', 'WORSHIPPER', 'COMMITTEE', 'MUSIC', 'SUNDAY_SERVICE', 'SPECIAL')`);
        await queryRunner.query(`CREATE TYPE "public"."attendance_status_enum" AS ENUM('present', 'absent', 'late')`);
        await queryRunner.query(`CREATE TYPE "public"."leave_leavetype_enum" AS ENUM('sick', 'vacation', 'personal', 'suspension', 'work', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('INCOME', 'EXPENSE')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_category_enum" AS ENUM('DAILY', 'DONATION', 'SPECIAL', 'OTHER', 'CHARITY', 'MAINTENANCE', 'TRANSPORT', 'SPECIAL_ASSISTANCE', 'COMMUNICATION', 'RESTAURATION')`);

        // Create tables
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" SERIAL NOT NULL,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "gender" "public"."gender_enum" NOT NULL,
                "maritalStatus" "public"."marital_status_enum" NOT NULL,
                "educationLevel" "public"."education_level_enum" NOT NULL,
                "profession" "public"."profession_enum" NOT NULL,
                "competenceDomain" character varying,
                "churchOfOrigin" character varying NOT NULL,
                "commune" "public"."commune_enum" NOT NULL,
                "quarter" character varying NOT NULL,
                "reference" character varying NOT NULL,
                "address" character varying NOT NULL,
                "phoneNumber" character varying NOT NULL,
                "whatsappNumber" character varying,
                "email" character varying NOT NULL,
                "phone" character varying,
                "commissions" text array NOT NULL DEFAULT '{}',
                "matricule" character varying,
                "categories" text array NOT NULL DEFAULT '{}',
                "fingerprintData" character varying,
                "voiceCategory" character varying,
                "joinDate" TIMESTAMP,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_phoneNumber" UNIQUE ("phoneNumber"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        // Create other tables (events, attendance, leave, transactions)
        // ... add the rest of your table creation queries here
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in correct order
        await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "attendance"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "leave"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "events"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

        // Drop enums
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."transactions_category_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."leave_leavetype_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."attendance_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."event_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."commune_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."profession_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."education_level_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."marital_status_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."gender_enum"`);
    }
}
