import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateReportsTable1759163257946 implements MigrationInterface {
    name = 'CreateReportsTable1759163257946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "reports" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL,
                "meetingDate" date NOT NULL,
                "content" text NOT NULL,
                "attachmentUrl" character varying,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "createdById" integer,
                CONSTRAINT "PK_reports_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "reports" 
            ADD CONSTRAINT "FK_reports_createdById" 
            FOREIGN KEY ("createdById") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "reports"`);
    }
}
