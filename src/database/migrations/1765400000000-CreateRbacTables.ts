import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRbacTables1765400000000 implements MigrationInterface {
  name = 'CreateRbacTables1765400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "departments" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_departments_code" UNIQUE ("code"),
                CONSTRAINT "PK_departments_id" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "permissions" (
                "id" SERIAL NOT NULL,
                "code" character varying NOT NULL,
                "description" text,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_permissions_code" UNIQUE ("code"),
                CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "roles" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "description" text,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_roles_code" UNIQUE ("code"),
                CONSTRAINT "PK_roles_id" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "role_permissions" (
                "roleId" integer NOT NULL,
                "permissionId" integer NOT NULL,
                CONSTRAINT "PK_role_permissions" PRIMARY KEY ("roleId", "permissionId")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_role_permissions_role"
            FOREIGN KEY ("roleId")
            REFERENCES "roles"("id")
            ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "role_permissions"
            ADD CONSTRAINT "FK_role_permissions_permission"
            FOREIGN KEY ("permissionId")
            REFERENCES "permissions"("id")
            ON DELETE CASCADE
        `);

    await queryRunner.query(`
            CREATE TABLE "user_role_assignments" (
                "id" SERIAL NOT NULL,
                "userId" integer NOT NULL,
                "roleId" integer NOT NULL,
                "departmentId" integer,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_role_assignments_id" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "user_role_assignments"
            ADD CONSTRAINT "FK_user_role_assignments_user"
            FOREIGN KEY ("userId")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "user_role_assignments"
            ADD CONSTRAINT "FK_user_role_assignments_role"
            FOREIGN KEY ("roleId")
            REFERENCES "roles"("id")
            ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "user_role_assignments"
            ADD CONSTRAINT "FK_user_role_assignments_department"
            FOREIGN KEY ("departmentId")
            REFERENCES "departments"("id")
            ON DELETE CASCADE
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_user_role_assignment_global"
            ON "user_role_assignments" ("userId", "roleId")
            WHERE "departmentId" IS NULL
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_user_role_assignment_scoped"
            ON "user_role_assignments" ("userId", "roleId", "departmentId")
            WHERE "departmentId" IS NOT NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_role_assignments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
  }
}
