import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePushTables1767200000000 implements MigrationInterface {
  name = 'CreatePushTables1767200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "push_subscriptions" (
        "id" SERIAL NOT NULL,
        "endpoint" text NOT NULL,
        "p256dh" text NOT NULL,
        "auth" text NOT NULL,
        "deviceId" character varying,
        "fullName" character varying,
        "contact" character varying,
        "userAgent" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_subscriptions_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_push_subscriptions_endpoint" ON "push_subscriptions" ("endpoint")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_push_subscriptions_deviceId" ON "push_subscriptions" ("deviceId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "program_reminders" (
        "id" SERIAL NOT NULL,
        "clientId" character varying,
        "deviceId" character varying,
        "title" character varying NOT NULL,
        "programmeTitle" character varying,
        "occurrenceDate" date NOT NULL,
        "time" character varying NOT NULL,
        "note" text,
        "sourceRef" character varying,
        "fullName" character varying,
        "contact" character varying,
        "notifiedAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_program_reminders_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_program_reminders_clientId" ON "program_reminders" ("clientId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_program_reminders_deviceId" ON "program_reminders" ("deviceId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "program_reminders"`);
    await queryRunner.query(`DROP TABLE "push_subscriptions"`);
  }
}
