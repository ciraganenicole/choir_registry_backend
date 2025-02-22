import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { Attendance } from './attendance.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { LeaveModule } from '../leave/leave.module';
import { JustificationModule } from '../justification/justification.module'; // Correctly importing JustificationModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, User]),
    UsersModule,
    LeaveModule,
    forwardRef(() => JustificationModule),
  ],
  providers: [AttendanceService],
  controllers: [AttendanceController],
  exports: [AttendanceService],  // Ensure AttendanceService is exported
})
export class AttendanceModule {}