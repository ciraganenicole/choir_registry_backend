import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminRole } from '../admin/admin-role.enum';
import { Department } from './department.entity';

@ApiTags('Departments')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(
    @InjectRepository(Department)
    private readonly departmentsRepo: Repository<Department>,
  ) {}

  @Get()
  @Roles(
    AdminRole.SUPER_ADMIN,
    AdminRole.ATTENDANCE_ADMIN,
    AdminRole.FINANCE_ADMIN,
  )
  @ApiOperation({ summary: 'List departments (admin)' })
  @ApiResponse({ status: 200, description: 'List of departments' })
  async listDepartments(): Promise<Department[]> {
    return this.departmentsRepo.find({ order: { name: 'ASC' } });
  }
}

