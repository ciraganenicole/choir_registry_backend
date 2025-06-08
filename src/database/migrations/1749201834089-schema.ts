import { MigrationInterface, QueryRunner } from "typeorm";

export class Schema1749201834089 implements MigrationInterface {
    name = 'Schema1749201834089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "choirs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "church" character varying NOT NULL, "logo" character varying, "slug" character varying NOT NULL, "country" character varying, "city" character varying, "address" character varying, "contactPhone" character varying, "contactEmail" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_12fccecd7e1de059c4f2544e8ec" UNIQUE ("slug"), CONSTRAINT "PK_130e9248a730219fa8a1c24198d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attendance" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "choir_id" uuid NOT NULL, "eventType" character varying NOT NULL DEFAULT 'OTHER', "date" date NOT NULL, "timeIn" TIME, "status" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'MANUAL', "justification" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee0ffe42c1f1a01e72b725c0cb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" SERIAL NOT NULL, "contributorId" uuid, "choir_id" uuid NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'USD', "type" character varying NOT NULL, "category" character varying NOT NULL, "subcategory" character varying, "description" text, "transactionDate" date NOT NULL, "externalContributorName" character varying, "externalContributorPhone" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('SUPER_ADMIN', 'CHOIR_ADMIN', 'ATTENDANCE_ADMIN', 'FINANCE_ADMIN', 'CHOIR_MEMBER')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "gender" character varying, "maritalStatus" character varying, "educationLevel" character varying, "profession" character varying, "competenceDomain" character varying, "churchOfOrigin" character varying, "commune" character varying, "quarter" character varying, "reference" character varying, "address" character varying, "phoneNumber" character varying, "whatsappNumber" character varying, "email" character varying NOT NULL, "password" character varying, "phone" character varying, "commissions" character varying array DEFAULT '{}', "matricule" character varying, "categories" character varying array DEFAULT '{NORMAL}', "fingerprintData" character varying, "voiceCategory" character varying, "joinDate" date, "isActive" boolean DEFAULT true, "status" character varying, "statusReason" character varying, "profileImageUrl" character varying, "choirId" uuid, "role" "public"."users_role_enum" NOT NULL DEFAULT 'CHOIR_MEMBER', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1e3d0240b49c40521aaeb953293" UNIQUE ("phoneNumber"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_97f73e8e81f7b794fd2455b6928" UNIQUE ("matricule"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_466e85b813d871bfb693f443528" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance" ADD CONSTRAINT "FK_9b94f36ebc50fba4328d0f9943b" FOREIGN KEY ("choir_id") REFERENCES "choirs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_c09a5bbc23ffa6bb6f61b5f0418" FOREIGN KEY ("contributorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_7614e41b8a0482dc5892d3ce203" FOREIGN KEY ("choir_id") REFERENCES "choirs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_784a234b00d8a5d93fe165d2c42" FOREIGN KEY ("choirId") REFERENCES "choirs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_784a234b00d8a5d93fe165d2c42"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_7614e41b8a0482dc5892d3ce203"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_c09a5bbc23ffa6bb6f61b5f0418"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_9b94f36ebc50fba4328d0f9943b"`);
        await queryRunner.query(`ALTER TABLE "attendance" DROP CONSTRAINT "FK_466e85b813d871bfb693f443528"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "attendance"`);
        await queryRunner.query(`DROP TABLE "choirs"`);
    }

}
