import { MigrationInterface, QueryRunner } from "typeorm";

export class FixMusicalKeyEnum1754399600000 implements MigrationInterface {
    name = 'FixMusicalKeyEnum1754399600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, check if the enum exists
        const enumExists = await queryRunner.query(`
            SELECT 1 FROM pg_type WHERE typname = 'musical_key_enum'
        `);

        if (enumExists.length > 0) {
            // Convert both tables to text first
            await queryRunner.query(`
                ALTER TABLE "rehearsal_songs" 
                ALTER COLUMN "musicalKey" TYPE text
            `);
            
            await queryRunner.query(`
                ALTER TABLE "performance_songs" 
                ALTER COLUMN "musicalKey" TYPE text
            `);
            
            // Drop the old enum
            await queryRunner.query(`DROP TYPE musical_key_enum`);
        }

        // Create the new enum with all the correct values
        await queryRunner.query(`
            CREATE TYPE musical_key_enum AS ENUM (
                'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
            )
        `);

        // Update both tables to use the new enum
        await queryRunner.query(`
            ALTER TABLE "rehearsal_songs" 
            ALTER COLUMN "musicalKey" TYPE musical_key_enum 
            USING "musicalKey"::musical_key_enum
        `);
        
        await queryRunner.query(`
            ALTER TABLE "performance_songs" 
            ALTER COLUMN "musicalKey" TYPE musical_key_enum 
            USING "musicalKey"::musical_key_enum
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert both tables to text type
        await queryRunner.query(`
            ALTER TABLE "rehearsal_songs" 
            ALTER COLUMN "musicalKey" TYPE text
        `);
        
        await queryRunner.query(`
            ALTER TABLE "performance_songs" 
            ALTER COLUMN "musicalKey" TYPE text
        `);
        
        // Drop the enum
        await queryRunner.query(`DROP TYPE musical_key_enum`);
    }
}
