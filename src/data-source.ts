import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { AdminUser } from './modules/admin/admin_users.entity';
import { Attendance } from './modules/attendance/attendance.entity';
import { User } from './modules/users/user.entity';
import { Transaction } from './modules/transactions/transaction.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_DATABASE || 'choir_registry',
  synchronize: false,
  logging: true,
  entities: [User, AdminUser, Attendance, Transaction],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
});
