import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

config();

// Dynamically set paths for dev vs. production
const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [path.join(__dirname, '../modules/**/*.entity.js')],
  migrations: [path.join(__dirname, '../database/migrations/*.js')],
  synchronize: false, // Don't use `true` in production!
  logging: isProduction ? false : ['error', 'warn'],
});
