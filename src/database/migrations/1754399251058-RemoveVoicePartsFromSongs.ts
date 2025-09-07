import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveVoicePartsFromSongs1754399251058 implements MigrationInterface {
    name = 'RemoveVoicePartsFromSongs1754399251058'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove the voice_parts column from the songs table
        await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "voice_parts"`);
        // Remove the duration column from the songs table
        await queryRunner.query(`ALTER TABLE "songs" DROP COLUMN "duration"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Add back the duration column if we need to rollback
        await queryRunner.query(`ALTER TABLE "songs" ADD COLUMN "duration" character varying(20) NOT NULL DEFAULT '0:00'`);
        // Add back the voice_parts column if we need to rollback
        await queryRunner.query(`ALTER TABLE "songs" ADD COLUMN "voice_parts" text array NOT NULL DEFAULT '{}'`);
    }
}
