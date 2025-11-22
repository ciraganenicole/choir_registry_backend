import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDurationFromSongs1754399500000 implements MigrationInterface {
    name = 'RemoveDurationFromSongs1754399500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the duration column from songs table
        await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "duration"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add the duration column back (nullable)
        await queryRunner.query(`ALTER TABLE "songs" ADD "duration" integer`);
    }
}
