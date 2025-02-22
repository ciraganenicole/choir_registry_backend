import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Leave } from './leave.entity';
import { UsersModule } from '../users/users.module';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Leave]), UsersModule],  // Import Users module for user-related data
  providers: [LeaveService],
  controllers: [LeaveController],
  exports: [LeaveService],  // Export service if needed in other modules
})
export class LeaveModule {}
