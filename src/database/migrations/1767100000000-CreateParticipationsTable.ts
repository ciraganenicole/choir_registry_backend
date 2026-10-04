import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParticipationsTable1767100000000
  implements MigrationInterface
{
  name = 'CreateParticipationsTable1767100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "participations" (
        "id" SERIAL NOT NULL,
        "programmeId" character varying,
        "programmeTitle" character varying,
        "occurrenceDate" character varying,
        "fullName" character varying NOT NULL,
        "contact" character varying NOT NULL,
        "note" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_participations_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "participations"`);
  }
}
