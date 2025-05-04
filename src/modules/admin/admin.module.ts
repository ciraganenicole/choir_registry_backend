import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminUser } from './admin_users.entity';
import { AdminUsersService } from './admin_users.service';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser]), GuardsModule],
  controllers: [AdminController],
  providers: [AdminUsersService],
  exports: [AdminUsersService],
})
export class AdminModule {} 