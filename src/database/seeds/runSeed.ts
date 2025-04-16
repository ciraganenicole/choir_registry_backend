import { AppDataSource } from '../../data-source';
import { adminSeeder } from './admin.seed';
import { userSeeder } from './user.seed';
import { TransactionSeeder } from './transaction.seed';
import { seedAttendance } from './attendance.seed';
import { DataSource } from 'typeorm';
import { seedUsers } from './users.seed';

const runSeed = async () => {
  try {
    console.log('🔌 Initializing Data Source...');
    await AppDataSource.initialize();
    console.log('✅ Data Source initialized');

    // Run migrations first
    console.log('🔄 Running migrations...');
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed');

    // Run seeds
    console.log('🌱 Starting seeding...');
    await adminSeeder(AppDataSource);
    // await userSeeder(AppDataSource);
    // await new TransactionSeeder().run(AppDataSource);
    // await seedEvents(AppDataSource);
    // await seedLeaves(AppDataSource);
    // await seedAttendance(AppDataSource);
    // await seedUsers(AppDataSource);
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

export const runSeedWithDataSource = async (dataSource: DataSource): Promise<void> => {
    try {
        // Run seeders in sequence
        await seedUsers(dataSource);
        await seedAttendance(dataSource);
        
        console.log('All seeders completed successfully');
    } catch (error) {
        console.error('Error running seeders:', error);
        throw error;
    }
};
