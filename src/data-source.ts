import { DataSource } from 'typeorm';
import { User } from './modules/users/user.entity';
import { AdminUser } from './modules/admin/admin_users.entity';
import { Attendance } from './modules/attendance/attendance.entity';
import { Leave } from './modules/leave/leave.entity';
import { Event } from './modules/events/event.entity';
import { config } from 'dotenv';
import { Transaction } from './modules/transactions/transactions.entity';
config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User, AdminUser, Attendance, Event, Leave, Transaction],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  logging: true,
});


