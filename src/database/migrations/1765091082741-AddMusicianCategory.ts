import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMusicianCategory1765091082741 implements MigrationInterface {
    name = 'AddMusicianCategory1765091082741'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // No database changes required - categories are stored as varchar array
        // The MUSICIAN category is validated at the application level via UserCategory enum
        // This migration documents when the MUSICIAN category was added to the system
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No database changes required - categories are stored as varchar array
        // The MUSICIAN category validation will be removed from the UserCategory enum
    }
}

