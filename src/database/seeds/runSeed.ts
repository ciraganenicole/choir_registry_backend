import { AppDataSource } from '../..//data-source';
import { adminSeeder } from './admin.seed';
import { seedTransactions } from './transaction.seed';
import { userSeeder } from './user.seed';

const runSeed = async () => {
  try {
    console.log('🔌 Initializing Data Source...');
    await AppDataSource.initialize();
    console.log('✅ Data Source initialized');

    // Run Admin Seeder
    await adminSeeder(AppDataSource);

    // Run User Seeder
    await userSeeder(AppDataSource);

    // Run Transaction Seeder
    await seedTransactions(AppDataSource);

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    console.log('🔌 Closing Data Source...');
    await AppDataSource.destroy();
    console.log('✅ Data Source closed.');
  }
};

runSeed();
