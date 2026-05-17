import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentTables1765500000000 implements MigrationInterface {
  name = 'CreateContentTables1765500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "content_types" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "allowedLinkedEntityTypes" jsonb,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_content_types_code" UNIQUE ("code"),
                CONSTRAINT "PK_content_types_id" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "content_field_definitions" (
                "id" SERIAL NOT NULL,
                "contentTypeId" integer NOT NULL,
                "fieldKey" character varying NOT NULL,
                "fieldType" character varying(32) NOT NULL,
                "label" character varying,
                "required" boolean NOT NULL DEFAULT false,
                "sortOrder" integer NOT NULL DEFAULT 0,
                "validation" jsonb,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_content_field_definitions_id" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_content_field_definitions_type_key"
            ON "content_field_definitions" ("contentTypeId", "fieldKey")
        `);

    await queryRunner.query(`
            ALTER TABLE "content_field_definitions"
            ADD CONSTRAINT "FK_content_field_definitions_content_type"
            FOREIGN KEY ("contentTypeId")
            REFERENCES "content_types"("id")
            ON DELETE CASCADE
        `);

    await queryRunner.query(`
            CREATE TABLE "contents" (
                "id" SERIAL NOT NULL,
                "contentTypeId" integer NOT NULL,
                "fieldValues" jsonb NOT NULL DEFAULT '{}',
                "linkedEntityType" character varying NOT NULL,
                "linkedEntityId" integer NOT NULL,
                "status" character varying(32) NOT NULL DEFAULT 'draft',
                "visibility" character varying(32) NOT NULL DEFAULT 'private',
                "audienceDepartmentId" integer,
                "authorId" integer,
                "approvedById" integer,
                "approvedAt" TIMESTAMP WITH TIME ZONE,
                "publishedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_contents_id" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_contents_linked"
            ON "contents" ("linkedEntityType", "linkedEntityId")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_contents_type_status"
            ON "contents" ("contentTypeId", "status")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_contents_audience_status"
            ON "contents" ("audienceDepartmentId", "status", "visibility")
        `);

    await queryRunner.query(`
            ALTER TABLE "contents"
            ADD CONSTRAINT "FK_contents_content_type"
            FOREIGN KEY ("contentTypeId")
            REFERENCES "content_types"("id")
            ON DELETE RESTRICT
        `);

    await queryRunner.query(`
            ALTER TABLE "contents"
            ADD CONSTRAINT "FK_contents_audience_department"
            FOREIGN KEY ("audienceDepartmentId")
            REFERENCES "departments"("id")
            ON DELETE SET NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "contents"
            ADD CONSTRAINT "FK_contents_author"
            FOREIGN KEY ("authorId")
            REFERENCES "users"("id")
            ON DELETE SET NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "contents"
            ADD CONSTRAINT "FK_contents_approved_by"
            FOREIGN KEY ("approvedById")
            REFERENCES "users"("id")
            ON DELETE SET NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contents" DROP CONSTRAINT "FK_contents_approved_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contents" DROP CONSTRAINT "FK_contents_author"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contents" DROP CONSTRAINT "FK_contents_audience_department"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contents" DROP CONSTRAINT "FK_contents_content_type"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "contents"`);
    await queryRunner.query(
      `ALTER TABLE "content_field_definitions" DROP CONSTRAINT "FK_content_field_definitions_content_type"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "content_field_definitions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "content_types"`);
  }
}
