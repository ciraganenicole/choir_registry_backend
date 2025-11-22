import { MigrationInterface, QueryRunner } from "typeorm";

export class MakePerformanceTitleNullable1754399400000 implements MigrationInterface {
    name = 'MakePerformanceTitleNullable1754399400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Make the title column nullable
        await queryRunner.query(`ALTER TABLE "performances" ALTER COLUMN "title" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Make the title column NOT NULL again (this will fail if there are NULL values)
        await queryRunner.query(`ALTER TABLE "performances" ALTER COLUMN "title" SET NOT NULL`);
    }
}
