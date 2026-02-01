import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssistantLeadToPerformances1765100000000 implements MigrationInterface {
    name = 'AddAssistantLeadToPerformances1765100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the assistantLeadId column
        await queryRunner.query(`ALTER TABLE "performances" ADD "assistantLeadId" integer`);
        
        // Add foreign key constraint
        await queryRunner.query(`ALTER TABLE "performances" ADD CONSTRAINT "FK_performances_assistant_lead" FOREIGN KEY ("assistantLeadId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the foreign key constraint
        await queryRunner.query(`ALTER TABLE "performances" DROP CONSTRAINT "FK_performances_assistant_lead"`);
        
        // Drop the column
        await queryRunner.query(`ALTER TABLE "performances" DROP COLUMN "assistantLeadId"`);
    }
}
