import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAdminUsersToIntegerIds1754399251050 implements MigrationInterface {
  name = 'UpdateAdminUsersToIntegerIds1754399251050';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, check if admin_users table exists
    const tableExists = await queryRunner.hasTable('admin_users');
    if (!tableExists) {
      return;
    }

    // Create a new admin_users table with integer ID
    await queryRunner.query(`
      CREATE TABLE "admin_users_new" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "username" character varying NOT NULL,
        "role" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_admin_users_new" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_users_new_email" UNIQUE ("email")
      )
    `);

    // Copy data from old table to new table (if any data exists)
    await queryRunner.query(`
      INSERT INTO "admin_users_new" ("email", "password", "username", "role", "createdAt", "isActive")
      SELECT "email", "password", "username", "role", "createdAt", "isActive"
      FROM "admin_users"
    `);

    // Drop the old table
    await queryRunner.query(`DROP TABLE "admin_users"`);

    // Rename the new table to the original name
    await queryRunner.query(`ALTER TABLE "admin_users_new" RENAME TO "admin_users"`);

    // Recreate the primary key constraint with the correct name
    await queryRunner.query(`ALTER TABLE "admin_users" DROP CONSTRAINT "PK_admin_users_new"`);
    await queryRunner.query(`ALTER TABLE "admin_users" ADD CONSTRAINT "PK_admin_users" PRIMARY KEY ("id")`);

    // Recreate the unique constraint with the correct name
    await queryRunner.query(`ALTER TABLE "admin_users" DROP CONSTRAINT "UQ_admin_users_new_email"`);
    await queryRunner.query(`ALTER TABLE "admin_users" ADD CONSTRAINT "UQ_admin_users_email" UNIQUE ("email")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a destructive migration, so we'll create a simple rollback
    // that recreates the table with UUID (though data will be lost)
    await queryRunner.query(`DROP TABLE "admin_users"`);
    
    await queryRunner.query(`
      CREATE TABLE "admin_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "username" character varying NOT NULL,
        "role" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_admin_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_users_email" UNIQUE ("email")
      )
    `);
  }
} 