import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProgrammeGenerationsTable1767000000000
  implements MigrationInterface
{
  name = 'CreateProgrammeGenerationsTable1767000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "programme_generations" (
        "id" SERIAL NOT NULL,
        "weekStart" date NOT NULL,
        "generatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_programme_generations_weekStart" UNIQUE ("weekStart"),
        CONSTRAINT "PK_programme_generations_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "programme_generations"`);
  }
}
