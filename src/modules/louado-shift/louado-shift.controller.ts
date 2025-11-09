import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LouadoShiftService } from './louado-shift.service';
import { CreateLouadoShiftDto } from './dto/create-louado-shift.dto';
import { UpdateLouadoShiftDto } from './dto/update-louado-shift.dto';
import { LouadoShiftFilterDto } from './dto/louado-shift-filter.dto';
import { CreateLouadoShiftBatchDto } from './dto/create-louado-shift-batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import { UserCategory } from '../users/enums/user-category.enum';
import { LouadoShift } from './louado-shift.entity';

@ApiTags('Louado Shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('louado-shifts')
export class LouadoShiftController {
  constructor(private readonly louadoShiftService: LouadoShiftService) {}

@Post()
@Roles(AdminRole.SUPER_ADMIN, UserCategory.WORSHIPPER, UserCategory.LEAD)
  @ApiOperation({ summary: 'Create a Louado shift assignment' })
  @ApiResponse({ status: 201, description: 'Louado shift created successfully' })
  async create(@Body() createLouadoShiftDto: CreateLouadoShiftDto): Promise<LouadoShift> {
    return this.louadoShiftService.create(createLouadoShiftDto);
  }

@Post('batch')
@Roles(AdminRole.SUPER_ADMIN, UserCategory.WORSHIPPER, UserCategory.LEAD)
  @ApiOperation({ summary: 'Create or update multiple Louado shifts in a single request' })
  @ApiResponse({ status: 201, description: 'Louado shifts processed successfully' })
  async upsertMany(@Body() batchDto: CreateLouadoShiftBatchDto): Promise<LouadoShift[]> {
    return this.louadoShiftService.upsertMany(batchDto);
  }

@Get()
@Roles(AdminRole.SUPER_ADMIN, UserCategory.WORSHIPPER, UserCategory.LEAD)
  @ApiOperation({ summary: 'List Louado shifts' })
  @ApiResponse({ status: 200, description: 'Louado shifts retrieved successfully' })
  async findAll(@Query() filterDto: LouadoShiftFilterDto): Promise<LouadoShift[]> {
    return this.louadoShiftService.findAll(filterDto);
  }

@Get(':id')
@Roles(AdminRole.SUPER_ADMIN, UserCategory.WORSHIPPER, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get a specific Louado shift assignment' })
  @ApiResponse({ status: 200, description: 'Louado shift retrieved successfully' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LouadoShift> {
    return this.louadoShiftService.findOne(id);
  }

@Patch(':id')
@Roles(AdminRole.SUPER_ADMIN, UserCategory.WORSHIPPER, UserCategory.LEAD)
  @ApiOperation({ summary: 'Update a Louado shift assignment' })
  @ApiResponse({ status: 200, description: 'Louado shift updated successfully' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLouadoShiftDto: UpdateLouadoShiftDto,
  ): Promise<LouadoShift> {
    return this.louadoShiftService.update(id, updateLouadoShiftDto);
  }

@Delete(':id')
@Roles(AdminRole.SUPER_ADMIN, UserCategory.WORSHIPPER, UserCategory.LEAD)
  @ApiOperation({ summary: 'Delete a Louado shift assignment' })
  @ApiResponse({ status: 200, description: 'Louado shift deleted successfully' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.louadoShiftService.remove(id);
  }
}

