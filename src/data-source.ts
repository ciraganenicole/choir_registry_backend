import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { AdminUser } from './modules/admin/admin_users.entity';
import { Attendance } from './modules/attendance/attendance.entity';
import { User } from './modules/users/user.entity';
import { Transaction } from './modules/transactions/transaction.entity';
import { Song } from './modules/song/song.entity';
import { LeadershipShift } from './modules/leadership-shift/leadership-shift.entity';
import { Performance } from './modules/performance/performance.entity';
import { PerformanceSong } from './modules/performance/performance-song.entity';
import { PerformanceSongMusician } from './modules/performance/performance-song-musician.entity';
import { PerformanceVoicePart } from './modules/performance/performance-voice-part.entity';
import { Rehearsal } from './modules/rehearsal/rehearsal.entity';
import { RehearsalSong } from './modules/rehearsal/rehearsal-song.entity';
import { RehearsalSongMusician } from './modules/rehearsal/rehearsal-song-musician.entity';
import { RehearsalVoicePart } from './modules/rehearsal/rehearsal-voice-part.entity';
import { Communique } from './modules/communiques/communique.entity';
import { Report } from './modules/reports/report.entity';

config();

const getConnectionUrl = () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const username = process.env.DB_USERNAME || 'postgres';
  const password = encodeURIComponent(process.env.DB_PASSWORD || 'your_password');
  const database = process.env.DB_DATABASE || 'choir_registry';
  
  // Use sslmode=disable for local development
  const url = `postgresql://${username}:${password}@${host}:${port}/${database}?sslmode=disable`;
  return url;
};

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: getConnectionUrl(),
  synchronize: false,
  logging: true,
  entities: [
    User, 
    AdminUser, 
    Attendance, 
    Transaction, 
    Song, 
    LeadershipShift, 
    Performance, 
    PerformanceSong, 
    PerformanceSongMusician, 
    PerformanceVoicePart,
    Rehearsal,
    RehearsalSong,
    RehearsalSongMusician,
    RehearsalVoicePart,
    Communique,
    Report
  ],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: [],
  ssl: {
    rejectUnauthorized: false
  }
});