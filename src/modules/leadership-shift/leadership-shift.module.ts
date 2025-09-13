import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadershipShiftController } from './leadership-shift.controller';
import { LeadershipShiftService } from './leadership-shift.service';
import { LeadershipShift } from './leadership-shift.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeadershipShift, User]),
  ],
  controllers: [LeadershipShiftController],
  providers: [LeadershipShiftService],
  exports: [LeadershipShiftService],
})
export class LeadershipShiftModule {} 