import { AppDataSource } from '../../data-source';
import { DataSource } from 'typeorm';
import { seedAttendance } from './attendance.seed';
import { seedContent } from './content.seed';
import { seedUsers } from './users.seed';

/**
 * Default seed: migrations + content CMS data.
 * Content only (no migrations): npm run seed:content
 * Programmatic full suite: runSeedWithDataSource()
 */
const runSeed = async () => {
  try {
    console.log('🔌 Initializing Data Source...');
    await AppDataSource.initialize();
    console.log('✅ Data Source initialized');

    console.log('🔄 Running migrations...');
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed');

    await seedContent(AppDataSource);
    console.log('✅ Content seeded');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      console.log('🔌 Closing Data Source...');
      await AppDataSource.destroy();
      console.log('✅ Data Source closed.');
    }
  }
};

void runSeed();

export const runSeedWithDataSource = async (
  dataSource: DataSource,
): Promise<void> => {
  try {
    await seedUsers(dataSource);
    await seedAttendance(dataSource);
    await seedContent(dataSource);
    console.log('All seeders completed successfully');
  } catch (error) {
    console.error('Error running seeders:', error);
    throw error;
  }
};
