import { AppDataSource } from '../../data-source';
import { seedContent } from './content.seed';

/**
 * Content-only seed: updates CMS types, field labels, and content entries.
 * Does not run users/attendance/admin seeders.
 *
 * Usage: npm run seed:content
 */
const runContentSeed = async () => {
  try {
    console.log('🔌 Initializing Data Source (content only)...');
    await AppDataSource.initialize();
    console.log('✅ Data Source initialized');

    await seedContent(AppDataSource);
    console.log('✅ Content seeded');
  } catch (error) {
    console.error('❌ Error during content seeding:', error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      console.log('🔌 Closing Data Source...');
      await AppDataSource.destroy();
      console.log('✅ Data Source closed.');
    }
  }
};

void runContentSeed();
