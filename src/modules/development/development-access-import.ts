import { EntityManager } from 'typeorm';
import { normalizePhone } from './development-phone.util';

/** Import explicite uniquement : ne réactive jamais les accès désactivés. */
export async function importDevelopmentDirectoryAccess(manager: EntityManager, source: string) {
  const phones = [
    ...new Set(
      source
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map(normalizePhone),
    ),
  ];
  let inserted = 0;
  for (const phone of phones) {
    const rows = await manager.query(
      `INSERT INTO development_directory_access (phone) VALUES ($1) ON CONFLICT (phone) DO NOTHING RETURNING phone`,
      [phone],
    );
    inserted += rows.length;
  }
  return { total: phones.length, inserted };
}
