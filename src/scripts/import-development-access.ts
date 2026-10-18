import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { importDevelopmentDirectoryAccess } from '../modules/development/development-access-import';

async function main() {
  const dataSource = new DataSource({ ...AppDataSource.options, logging: false });
  try {
    const source = process.env.DEVELOPMENT_DIRECTORY_PHONES;
    if (!source?.trim())
      throw new Error('Renseignez DEVELOPMENT_DIRECTORY_PHONES pour cet import explicite.');
    await dataSource.initialize();
    const result = await dataSource.transaction((manager) =>
      importDevelopmentDirectoryAccess(manager, source),
    );
    console.log(
      `${result.inserted} accès ajouté(s) en base sur ${result.total} numéro(s) distinct(s). Les accès existants sont conservés.`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'L’import des accès a échoué.');
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}
void main();
