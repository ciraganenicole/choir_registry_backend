import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordToUsers1751613305879 implements MigrationInterface {
    name = 'AddPasswordToUsers1751613305879'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add password column to users table
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "password" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove password column from users table
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    }
} 