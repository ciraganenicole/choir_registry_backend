import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { Attendance } from './attendance.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { WebAuthnModule } from '../webauthn/webauthn.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, User]),
    UsersModule,
    forwardRef(() => WebAuthnModule), // Resolving circular dependency for WebAuthnService
  ],
  providers: [AttendanceService],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}