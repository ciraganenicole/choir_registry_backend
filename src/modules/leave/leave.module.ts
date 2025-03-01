import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { Leave } from './leave.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Leave]),
    UsersModule,
  ],
  controllers: [LeaveController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {} 