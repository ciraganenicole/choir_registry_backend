import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCommuniquesTable1759158041880 implements MigrationInterface {
    name = 'CreateCommuniquesTable1759158041880'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "communiques" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL,
                "content" text NOT NULL,
                "attachmentUrl" character varying,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdById" integer,
                CONSTRAINT "PK_communiques_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "communiques" 
            ADD CONSTRAINT "FK_communiques_createdById" 
            FOREIGN KEY ("createdById") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "communiques"`);
    }
}
