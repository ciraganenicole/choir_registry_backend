import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1741019070455 implements MigrationInterface {
    name = 'InitialMigration1741019070455'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TYPE "public"."event_type_enum" RENAME TO "event_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."event_type_enum" AS ENUM('NORMAL', 'WORSHIPPER', 'COMMITTEE', 'MUSIC', 'SUNDAY_SERVICE', 'SPECIAL')`);
        await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "type" TYPE "public"."event_type_enum" USING "type"::"text"::"public"."event_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."event_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."event_type_enum_old" AS ENUM('NORMAL', 'LOUADO', 'ADMINISTRATION', 'MUSIC', 'SPECIAL')`);
        await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "type" TYPE "public"."event_type_enum_old" USING "type"::"text"::"public"."event_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."event_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."event_type_enum_old" RENAME TO "event_type_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password" character varying NOT NULL`);
    }

}
