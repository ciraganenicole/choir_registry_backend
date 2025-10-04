import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Communique } from './communique.entity';
import { CommuniqueService } from './communique.service';
import { CommuniqueController } from './communique.controller';
import { User } from '../users/user.entity';
import { AdminUser } from '../admin/admin_users.entity';
import { GuardsModule } from '../../common/guards/guards.module';

@Module({
  imports: [TypeOrmModule.forFeature([Communique, User, AdminUser]), GuardsModule],
  providers: [CommuniqueService],
  controllers: [CommuniqueController],
  exports: [CommuniqueService],
})
export class CommuniqueModule {}
