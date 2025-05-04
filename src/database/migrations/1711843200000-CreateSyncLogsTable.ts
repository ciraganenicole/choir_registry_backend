import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSyncLogsTable1711843200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First create the enum types
        await queryRunner.query(`
            CREATE TYPE sync_entity_type_enum AS ENUM ('user', 'attendance', 'transaction');
            CREATE TYPE sync_operation_enum AS ENUM ('create', 'update', 'delete');
        `);

        // Then create the table
        await queryRunner.createTable(
            new Table({
                name: 'sync_logs',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'entity_type',
                        type: 'sync_entity_type_enum',
                    },
                    {
                        name: 'entity_id',
                        type: 'int',
                    },
                    {
                        name: 'operation',
                        type: 'sync_operation_enum',
                    },
                    {
                        name: 'changes',
                        type: 'jsonb',
                    },
                    {
                        name: 'sync_timestamp',
                        type: 'timestamp',
                    },
                    {
                        name: 'is_synced',
                        type: 'boolean',
                        default: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true
        );

        // Add indexes for better performance
        await queryRunner.query(`
            CREATE INDEX idx_sync_logs_entity ON sync_logs(entity_type, entity_id);
            CREATE INDEX idx_sync_logs_timestamp ON sync_logs(sync_timestamp);
            CREATE INDEX idx_sync_logs_synced ON sync_logs(is_synced);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_sync_logs_entity;
            DROP INDEX IF EXISTS idx_sync_logs_timestamp;
            DROP INDEX IF EXISTS idx_sync_logs_synced;
        `);

        // Drop the table
        await queryRunner.dropTable('sync_logs');

        // Drop the enum types
        await queryRunner.query(`
            DROP TYPE IF EXISTS sync_entity_type_enum;
            DROP TYPE IF EXISTS sync_operation_enum;
        `);
    }
} 