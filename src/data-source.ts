import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const getConnectionUrl = () => {
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
  url: getConnectionUrl(),
  type: 'postgres',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  subscribers: [],
  ssl: {
    rejectUnauthorized: false
  }
});