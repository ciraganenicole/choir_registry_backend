import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLouadoShiftsTable1759166000000 implements MigrationInterface {
    name = 'CreateLouadoShiftsTable1759166000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "louado_shifts" (
                "id" SERIAL NOT NULL,
                "date" date NOT NULL,
                "louangeId" integer NOT NULL,
                "adorationId" integer NOT NULL,
                "notes" text,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_louado_shifts_date" UNIQUE ("date"),
                CONSTRAINT "PK_louado_shifts_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "louado_shifts"
            ADD CONSTRAINT "FK_louado_shifts_louange"
            FOREIGN KEY ("louangeId")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "louado_shifts"
            ADD CONSTRAINT "FK_louado_shifts_adoration"
            FOREIGN KEY ("adorationId")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "louado_shifts" DROP CONSTRAINT "FK_louado_shifts_adoration"`);
        await queryRunner.query(`ALTER TABLE "louado_shifts" DROP CONSTRAINT "FK_louado_shifts_louange"`);
        await queryRunner.query(`DROP TABLE "louado_shifts"`);
    }
}

