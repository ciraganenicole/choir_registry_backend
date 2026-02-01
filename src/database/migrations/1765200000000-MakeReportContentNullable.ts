import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeReportContentNullable1765200000000 implements MigrationInterface {
    name = 'MakeReportContentNullable1765200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make the content column nullable
        await queryRunner.query(`ALTER TABLE "reports" ALTER COLUMN "content" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Make the content column NOT NULL again (this will fail if there are NULL values)
        await queryRunner.query(`ALTER TABLE "reports" ALTER COLUMN "content" SET NOT NULL`);
    }
}
