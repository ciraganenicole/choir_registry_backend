import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LouadoShiftService } from './louado-shift.service';
import { LouadoShiftController } from './louado-shift.controller';
import { LouadoShift } from './louado-shift.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LouadoShift, User])],
  controllers: [LouadoShiftController],
  providers: [LouadoShiftService],
  exports: [LouadoShiftService],
})
export class LouadoShiftModule {}

