import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import { UserCategory } from '../users/enums/user-category.enum';
import { LeadershipShiftService } from './leadership-shift.service';
import { CreateLeadershipShiftDto } from './dto/create-leadership-shift.dto';
import { UpdateLeadershipShiftDto } from './dto/update-leadership-shift.dto';
import { LeadershipShiftFilterDto } from './dto/leadership-shift-filter.dto';
import { LeadershipShift, ShiftStatus } from './leadership-shift.entity';

@ApiTags('Leadership Shifts')
@ApiBearerAuth()
@Controller('leadership-shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadershipShiftController {
  constructor(private readonly leadershipShiftService: LeadershipShiftService) {}

  @Post()
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Create a new leadership shift' })
  @ApiResponse({ status: 201, description: 'Leadership shift created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(
    @Body() createLeadershipShiftDto: CreateLeadershipShiftDto,
    @CurrentUser() user: any,
  ): Promise<LeadershipShift> {
    return this.leadershipShiftService.create(createLeadershipShiftDto, user.id);
  }

  @Get()
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get all leadership shifts with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Leadership shifts retrieved successfully' })
  async findAll(@Query() filterDto: LeadershipShiftFilterDto): Promise<[LeadershipShift[], number]> {
    return this.leadershipShiftService.findAll(filterDto);
  }

  @Get('stats')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get leadership shift statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.leadershipShiftService.getStats();
  }

  @Get('history')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get leader history and performance' })
  @ApiResponse({ status: 200, description: 'Leader history retrieved successfully' })
  async getLeaderHistory() {
    return this.leadershipShiftService.getLeaderHistory();
  }

  @Get('current')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get current active leadership shift' })
  @ApiResponse({ status: 200, description: 'Current shift retrieved successfully' })
  async getCurrentShift() {
    return this.leadershipShiftService.getCurrentShift();
  }

  @Get('upcoming')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get upcoming leadership shifts' })
  @ApiResponse({ status: 200, description: 'Upcoming shifts retrieved successfully' })
  async getUpcomingShifts(@Query('limit') limit?: number) {
    return this.leadershipShiftService.getUpcomingShifts(limit);
  }

  @Get('leader/:leaderId')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get all shifts for a specific leader' })
  @ApiResponse({ status: 200, description: 'Leader shifts retrieved successfully' })
  async getShiftsByLeader(@Param('leaderId', ParseIntPipe) leaderId: number) {
    return this.leadershipShiftService.getShiftsByLeader(leaderId);
  }

  @Get(':id')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get a specific leadership shift by ID' })
  @ApiResponse({ status: 200, description: 'Leadership shift retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Leadership shift not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LeadershipShift> {
    return this.leadershipShiftService.findOne(id);
  }

  @Patch(':id')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Update a leadership shift' })
  @ApiResponse({ status: 200, description: 'Leadership shift updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Leadership shift not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeadershipShiftDto: UpdateLeadershipShiftDto,
    @CurrentUser() user: any,
  ): Promise<LeadershipShift> {
    return this.leadershipShiftService.update(id, updateLeadershipShiftDto, user.id);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiResponse({ status: 200, description: 'Leadership shift deleted successfully' })
  @ApiResponse({ status: 404, description: 'Leadership shift not found' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<void> {
    return this.leadershipShiftService.remove(id, user.id);
  }

  @Get('status/:status')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get leadership shifts by status' })
  @ApiResponse({ status: 200, description: 'Shifts retrieved successfully' })
  async getByStatus(@Param('status') status: ShiftStatus) {
    return this.leadershipShiftService.findAll({ status });
  }



  @Post('update-statuses')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Automatically update shift statuses based on current date' })
  @ApiResponse({ status: 200, description: 'Shift statuses updated successfully' })
  async updateShiftStatuses() {
    return this.leadershipShiftService.updateShiftStatuses();
  }

  @Get('current-active')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get current active shift (automatically determined by date)' })
  @ApiResponse({ status: 200, description: 'Current active shift retrieved' })
  async getCurrentActiveShift() {
    return this.leadershipShiftService.getCurrentActiveShift();
  }

  @Get('next-upcoming')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get next upcoming shift (automatically determined by date)' })
  @ApiResponse({ status: 200, description: 'Next upcoming shift retrieved' })
  async getNextUpcomingShift() {
    return this.leadershipShiftService.getNextUpcomingShift();
  }
} 