import { MigrationInterface, QueryRunner } from 'typeorm';
import { importDevelopmentDirectoryAccess } from '../../modules/development/development-access-import';

export class CreateDevelopmentDirectoryAccess1792300000001 implements MigrationInterface {
  name = 'CreateDevelopmentDirectoryAccess1792300000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE development_directory_access (
        phone varchar PRIMARY KEY CHECK (phone ~ '^[+][1-9][0-9]{7,14}$'),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    // Reprendre la configuration existante une seule fois, à l’installation.
    await importDevelopmentDirectoryAccess(
      queryRunner.manager,
      process.env.DEVELOPMENT_DIRECTORY_PHONES || '',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE development_directory_access');
  }
}
