import { AppDataSource } from '../../data-source';
import { adminSeeder } from './admin.seed';
import { TransactionSeeder } from './transaction.seed';
import { seedAttendance } from './attendance.seed';
import { DataSource } from 'typeorm';
import { seedUsers } from './users.seed';
import { seedContent } from './content.seed';

const runSeed = async () => {
  try {
    console.log('🔌 Initializing Data Source...');
    await AppDataSource.initialize();
    console.log('✅ Data Source initialized');

    // Run migrations first
    console.log('🔄 Running migrations...');
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed');

    // // Run all seeders
    // await seedUsers(AppDataSource);
    // console.log('✅ Users seeded');
    
    // await seedAttendance(AppDataSource);
    // console.log('✅ Attendance seeded');

    await seedContent(AppDataSource);
    console.log('✅ Content seeded');

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
        await seedContent(dataSource);
        
        console.log('All seeders completed successfully');
    } catch (error) {
        console.error('Error running seeders:', error);
        throw error;
    }
};
