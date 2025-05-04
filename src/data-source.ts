import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { AdminUser } from './modules/admin/admin_users.entity';
import { Attendance } from './modules/attendance/attendance.entity';
import { User } from './modules/users/user.entity';
import { Transaction } from './modules/transactions/transaction.entity';

config();

const getConnectionUrl = () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const username = process.env.DB_USERNAME || 'postgres';
  const password = encodeURIComponent(process.env.DB_PASSWORD || 'your_password');
  const database = process.env.DB_DATABASE || 'choir_registry';
  
  // Use sslmode=disable for local development
  const url = `postgresql://${username}:${password}@${host}:${port}/${database}?sslmode=disable`;
  console.log('Attempting to connect to database with host:', host);
  return url;
};

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: getConnectionUrl(),
  synchronize: false,
  logging: true,
  entities: [User, AdminUser, Attendance, Transaction],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
  ssl: {
    rejectUnauthorized: false
  }
});
