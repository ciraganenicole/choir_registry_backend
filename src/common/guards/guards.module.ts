import { Module } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';
import { UsersModule } from '../../modules/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [RolesGuard, PermissionsGuard],
  exports: [RolesGuard, PermissionsGuard],
})
export class GuardsModule {} 