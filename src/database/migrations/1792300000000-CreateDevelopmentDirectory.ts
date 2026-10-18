import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  DEVELOPMENT_CATALOG,
  normalizeSpecialty,
} from '../../modules/development/development.catalog';
export class CreateDevelopmentDirectory1792300000000 implements MigrationInterface {
  name = 'CreateDevelopmentDirectory1792300000000';
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      `CREATE TABLE development_sectors (id SERIAL PRIMARY KEY, name varchar NOT NULL UNIQUE)`,
    );
    await q.query(
      `CREATE TABLE development_subcategories (id SERIAL PRIMARY KEY, name varchar NOT NULL, "sectorId" integer NOT NULL REFERENCES development_sectors(id), UNIQUE ("sectorId", name))`,
    );
    await q.query(
      `CREATE TABLE development_specialties (id SERIAL PRIMARY KEY, name varchar NOT NULL, "normalizedName" varchar NOT NULL, "subcategoryId" integer NOT NULL REFERENCES development_subcategories(id), UNIQUE ("subcategoryId", "normalizedName"))`,
    );
    await q.query(
      `CREATE TABLE development_profiles (id SERIAL PRIMARY KEY, phone varchar NOT NULL UNIQUE, "fullName" varchar NOT NULL, description text NOT NULL DEFAULT '', "photoUrl" varchar, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE development_profile_specialties ("profileId" integer NOT NULL REFERENCES development_profiles(id) ON DELETE CASCADE, "specialtyId" integer NOT NULL REFERENCES development_specialties(id) ON DELETE CASCADE, PRIMARY KEY ("profileId", "specialtyId"))`,
    );
    await q.query(
      `CREATE INDEX development_profile_specialty_idx ON development_profile_specialties ("specialtyId")`,
    );
    await q.query(
      `CREATE INDEX development_profile_name_idx ON development_profiles ("fullName", id)`,
    );
    for (const [sector, subcategories] of Object.entries(DEVELOPMENT_CATALOG)) {
      const [s] = await q.query(`INSERT INTO development_sectors (name) VALUES ($1) RETURNING id`, [
        sector,
      ]);
      for (const [subcategory, specialties] of Object.entries(subcategories)) {
        const [c] = await q.query(
          `INSERT INTO development_subcategories (name, "sectorId") VALUES ($1, $2) RETURNING id`,
          [subcategory, s.id],
        );
        for (const specialty of specialties)
          await q.query(
            `INSERT INTO development_specialties (name, "normalizedName", "subcategoryId") VALUES ($1, $2, $3)`,
            [specialty, normalizeSpecialty(specialty), c.id],
          );
      }
    }
  }
  async down(q: QueryRunner): Promise<void> {
    await q.query(
      'DROP TABLE development_profile_specialties, development_profiles, development_specialties, development_subcategories, development_sectors',
    );
  }
}
