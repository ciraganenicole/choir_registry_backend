import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRehearsalChoirMembersTable1754399300009 implements MigrationInterface {
  name = 'AddRehearsalChoirMembersTable1754399300009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the table already exists (it might have been created in a previous migration)
    const tableExists = await queryRunner.hasTable('rehearsal_choir_members');
    
    if (!tableExists) {
      // Create rehearsal_choir_members junction table
      await queryRunner.query(`
        CREATE TABLE "rehearsal_choir_members" (
          "rehearsalId" integer NOT NULL,
          "userId" integer NOT NULL,
          CONSTRAINT "PK_rehearsal_choir_members" PRIMARY KEY ("rehearsalId", "userId")
        )
      `);

      // Add foreign key constraints
      const usersTableExists = await queryRunner.hasTable('users');
      const rehearsalsTableExists = await queryRunner.hasTable('rehearsals');

      if (rehearsalsTableExists) {
        await queryRunner.query(`
          ALTER TABLE "rehearsal_choir_members"
          ADD CONSTRAINT "FK_rehearsal_choir_members_rehearsal"
          FOREIGN KEY ("rehearsalId") REFERENCES "rehearsals"("id") ON DELETE CASCADE
        `);
      }

      if (usersTableExists) {
        await queryRunner.query(`
          ALTER TABLE "rehearsal_choir_members"
          ADD CONSTRAINT "FK_rehearsal_choir_members_user"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);
      }

      // Add indexes for better performance
      await queryRunner.query(`
        CREATE INDEX "IDX_rehearsal_choir_members_rehearsal_id" ON "rehearsal_choir_members" ("rehearsalId")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_rehearsal_choir_members_user_id" ON "rehearsal_choir_members" ("userId")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsal_choir_members_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_rehearsal_choir_members_rehearsal_id"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "rehearsal_choir_members" DROP CONSTRAINT IF EXISTS "FK_rehearsal_choir_members_user"`);
    await queryRunner.query(`ALTER TABLE "rehearsal_choir_members" DROP CONSTRAINT IF EXISTS "FK_rehearsal_choir_members_rehearsal"`);

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "rehearsal_choir_members"`);
  }
}
