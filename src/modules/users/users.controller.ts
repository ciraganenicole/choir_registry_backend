/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { UserCategory } from './enums/user-category.enum';
import { API_ROUTES } from '../../common/routes/api.routes';
import { UserFilterDto } from './dto/user-filter.dto';
import { Transaction } from '../transactions/transaction.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';

@ApiTags('Users')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(API_ROUTES.USERS.BASE)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Get all users with filters and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'letter', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async getUsers(
    @Query(new ValidationPipe({ transform: true })) filterDto: UserFilterDto
  ): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const [users, total] = await this.usersService.getAllUsers(filterDto);
    return {
      data: users,
      total,
      page: filterDto.page || 1,
      limit: filterDto.limit || 10
    };
  }

  @Post(API_ROUTES.USERS.BASE)
  @Roles(AdminRole.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUser(@Body() userData: CreateUserDto): Promise<User> {
    return this.usersService.createUser(userData);
  }

  @Put(API_ROUTES.USERS.BY_ID)
  @Roles(AdminRole.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: UpdateUserDto
  ): Promise<User> {
    return this.usersService.updateUser(id, userData);
  }

  @Put(API_ROUTES.USERS.BY_ID + '/status')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async toggleUserStatus(
    @Param('id', ParseIntPipe) id: number
  ): Promise<User> {
    const user = await this.usersService.findById(id);
    return this.usersService.updateUser(id, { isActive: !user.isActive });
  }

  @Delete(API_ROUTES.USERS.BY_ID)
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  @Get(API_ROUTES.USERS.BY_CATEGORY)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiParam({ name: 'category', enum: UserCategory })
  async getUsersByCategory(@Param('category') category: UserCategory): Promise<User[]> {
    return this.usersService.getUsersByCategory(category);
  }

  @Get(API_ROUTES.USERS.TRANSACTIONS)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiParam({ name: 'id', type: Number })
  async getUserTransactions(@Param('id', ParseIntPipe) id: number): Promise<Transaction[]> {
    return this.usersService.getUserTransactions(id);
  }

  @Get(':id/contribution-stats')
  @ApiOperation({ summary: 'Get user contribution statistics with optional date filtering' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({ 
      name: 'startDate', 
      required: false, 
      description: 'Start date for filtering (YYYY-MM-DD)',
      type: String 
  })
  @ApiQuery({ 
      name: 'endDate', 
      required: false, 
      description: 'End date for filtering (YYYY-MM-DD)',
      type: String 
  })
  async getContributionStats(
      @Param('id', ParseIntPipe) id: number,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string
  ) {
      return this.usersService.getUserContributionStats(
          id,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
      );
  }
} 