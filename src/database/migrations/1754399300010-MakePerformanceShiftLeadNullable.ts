import { MigrationInterface, QueryRunner } from "typeorm";

export class MakePerformanceShiftLeadNullable1754399300010 implements MigrationInterface {
    name = 'MakePerformanceShiftLeadNullable1754399300010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing foreign key constraint
        await queryRunner.query(`ALTER TABLE "performances" DROP CONSTRAINT "FK_performances_shift_lead"`);
        
        // Drop the existing column
        await queryRunner.query(`ALTER TABLE "performances" DROP COLUMN "shiftLeadId"`);
        
        // Add the column back as nullable
        await queryRunner.query(`ALTER TABLE "performances" ADD "shiftLeadId" integer`);
        
        // Recreate the foreign key constraint
        await queryRunner.query(`ALTER TABLE "performances" ADD CONSTRAINT "FK_performances_shift_lead" FOREIGN KEY ("shiftLeadId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the foreign key constraint
        await queryRunner.query(`ALTER TABLE "performances" DROP CONSTRAINT "FK_performances_shift_lead"`);
        
        // Drop the nullable column
        await queryRunner.query(`ALTER TABLE "performances" DROP COLUMN "shiftLeadId"`);
        
        // Add the column back as NOT NULL (this will fail if there are NULL values)
        await queryRunner.query(`ALTER TABLE "performances" ADD "shiftLeadId" integer NOT NULL`);
        
        // Recreate the foreign key constraint
        await queryRunner.query(`ALTER TABLE "performances" ADD CONSTRAINT "FK_performances_shift_lead" FOREIGN KEY ("shiftLeadId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
