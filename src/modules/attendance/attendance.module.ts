import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance } from './attendance.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { LeaveModule } from '../leave/leave.module';
import { Leave } from '../leave/leave.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, User, Leave]),
    UsersModule,
    LeaveModule
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService]
})
export class AttendanceModule {} 