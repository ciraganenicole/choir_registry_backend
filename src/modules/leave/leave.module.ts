import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { LeaveController } from './leave.controller';
import { LeavesService } from './leave.service';
import { Leave } from './leave.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Leave]),
    UsersModule,
  ],
  controllers: [LeaveController],
  providers: [LeavesService],
  exports: [LeavesService],
})
export class LeaveModule {} 