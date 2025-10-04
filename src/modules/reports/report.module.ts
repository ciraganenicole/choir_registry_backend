import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { User } from '../users/user.entity';
import { AdminUser } from '../admin/admin_users.entity';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [TypeOrmModule.forFeature([Report, User, AdminUser]), GuardsModule],
  providers: [ReportService],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
