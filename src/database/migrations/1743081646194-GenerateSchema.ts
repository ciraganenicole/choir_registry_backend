import { MigrationInterface, QueryRunner } from "typeorm";

export class GenerateSchema1743081646194 implements MigrationInterface {
    name = 'GenerateSchema1743081646194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "admin_users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "username" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'CHOIR_ADMIN', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "isActive" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_dcd0c8a4b10af9c986e510b9ecc" UNIQUE ("email"), CONSTRAINT "PK_06744d221bb6145dc61e5dc441d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "leave" ("id" SERIAL NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "reason" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_501f6ea368365d2a40b1660e16b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" SERIAL NOT NULL, "contributorId" integer, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'USD', "type" character varying NOT NULL, "category" character varying NOT NULL, "subcategory" character varying, "description" text, "transactionDate" date NOT NULL, "externalContributorName" character varying, "externalContributorPhone" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "gender" character varying, "maritalStatus" character varying, "educationLevel" character varying, "profession" character varying, "competenceDomain" character varying, "churchOfOrigin" character varying, "commune" character varying, "quarter" character varying, "reference" character varying, "address" character varying, "phoneNumber" character varying, "whatsappNumber" character varying, "email" character varying, "phone" character varying, "commissions" character varying array DEFAULT '{}', "matricule" character varying, "categories" character varying array DEFAULT '{NORMAL}', "fingerprintData" character varying, "voiceCategory" character varying, "joinDate" date, "isActive" boolean DEFAULT true, "profileImageUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293" UNIQUE ("phoneNumber"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_97f73e8e81f7b794fd2455b6928" UNIQUE ("matricule"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attendance" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "eventType" character varying NOT NULL DEFAULT 'OTHER', "date" date NOT NULL, "timeIn" TIME, "status" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'MANUAL', "justification" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "leave" ADD CONSTRAINT "FK_9fb20081bf48840a16e0d33d14e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_c09a5bbc23ffa6bb6f61b5f0418" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_466e85b813d871bfb693f443528" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_466e85b813d871bfb693f443528"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_c09a5bbc23ffa6bb6f61b5f0418"`);
        await queryRunner.query(`ALTER TABLE "leave" DROP CONSTRAINT "FK_9fb20081bf48840a16e0d33d14e"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "leave"`);
        await queryRunner.query(`DROP TABLE "admin_users"`);
    }

}
