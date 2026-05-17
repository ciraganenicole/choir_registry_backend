import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Transaction } from '../transactions/transaction.entity';
import { TransactionModule } from '../transactions/transaction.module';
import { Department } from './department.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { UserRoleAssignment } from './user-role-assignment.entity';
import { RbacService } from './rbac.service';
import { DepartmentsController } from './departments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Transaction,
      Department,
      Permission,
      Role,
      UserRoleAssignment,
    ]),
    TransactionModule,
  ],
  controllers: [UsersController, DepartmentsController],
  providers: [UsersService, RbacService],
  exports: [UsersService, RbacService],
})
export class UsersModule {} 