import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { SongModule } from './modules/song/song.module';
import { LeadershipShiftModule } from './modules/leadership-shift/leadership-shift.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { RehearsalModule } from './modules/rehearsal/rehearsal.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { TransactionModule } from './modules/transactions/transaction.module';
import { UploadModule } from './modules/upload/upload.module';
import { CommuniqueModule } from './modules/communiques/communique.module';
import { ReportModule } from './modules/reports/report.module';
import { LouadoShiftModule } from './modules/louado-shift/louado-shift.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: ['dist/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    AdminModule,
    SongModule,
    LeadershipShiftModule,
    PerformanceModule,
    RehearsalModule,
    AttendanceModule,
    TransactionModule,
    UploadModule,
    CommuniqueModule,
    ReportModule,
    LouadoShiftModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
