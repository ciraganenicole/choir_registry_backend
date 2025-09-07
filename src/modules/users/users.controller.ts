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
  NotFoundException,
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
import * as bcrypt from 'bcrypt';

@ApiTags('Users')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(API_ROUTES.USERS.BASE)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get all users with filters and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'letter', required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'List of users with pagination info' })
  async getUsers(@Query(new ValidationPipe({ transform: true })) filterDto: UserFilterDto): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const [users, total] = await this.usersService.getAllUsers(filterDto);
    return {
      data: users,
      total,
      page: filterDto.page || 1,
      limit: filterDto.limit || 10
    };
  }

  @Get(API_ROUTES.USERS.BY_ID)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findById(id);
  }

  @Get(API_ROUTES.USERS.BY_ID + '/with-attendance-transactions')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get user with attendance and transactions' })
  @ApiResponse({ status: 200, description: 'User with attendance and transactions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserWithAttendanceAndTransactions(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.getUserWithAttendanceAndTransactions(id);
  }

  @Post(API_ROUTES.USERS.BASE)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(createUserDto);
  }

  @Put(API_ROUTES.USERS.BY_ID)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(API_ROUTES.USERS.BY_ID)
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.deleteUser(id);
  }

  @Get(API_ROUTES.USERS.BY_CATEGORY)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD)
  @ApiParam({ name: 'category', enum: UserCategory })
  async getUsersByCategory(@Param('category') category: UserCategory): Promise<User[]> {
    return this.usersService.getUsersByCategory(category);
  }

  @Get('/users/search')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Search users by query' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchUsers(@Query('q') query: string): Promise<User[]> {
    return this.usersService.searchUsers(query);
  }

  @Get(API_ROUTES.USERS.TRANSACTIONS)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiResponse({ status: 200, description: 'User transactions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserTransactions(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: Date,
  ): Promise<Transaction[]> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.usersService.getUserTransactions(id, start, end);
  }

  @Get(':id/contribution-stats')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get user contribution statistics' })
  @ApiResponse({ status: 200, description: 'User contribution statistics' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserContributionStats(
    @Param('id', ParseIntPipe) id: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: Date,
  ): Promise<any> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.usersService.getUserContributionStats(id, start, end);
  }

  // LEAD Management Endpoints
  @Post(API_ROUTES.USERS.BY_ID + '/assign-lead')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign LEAD category and generate password for user' })
  @ApiResponse({ status: 200, description: 'LEAD role assigned successfully' })
  async assignLeadRole(@Param('id', ParseIntPipe) id: number): Promise<{ user: User; password: string; message: string }> {
    const result = await this.usersService.assignLeadRole(id);
    return {
      user: result.user,
      password: result.password,
      message: `LEAD role assigned successfully. Password: ${result.password}`
    };
  }

  @Delete(API_ROUTES.USERS.BY_ID + '/remove-lead')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove LEAD category from user' })
  @ApiResponse({ status: 200, description: 'LEAD role removed successfully' })
  async removeLeadRole(@Param('id', ParseIntPipe) id: number): Promise<{ user: User; message: string }> {
    const user = await this.usersService.removeLeadRole(id);
    return {
      user,
      message: 'LEAD role removed successfully'
    };
  }

  @Get('/leads')
  @Roles(AdminRole.SUPER_ADMIN, UserCategory.LEAD)
  @ApiOperation({ summary: 'Get all users with LEAD category' })
  @ApiResponse({ status: 200, description: 'List of LEAD users' })
  async getLeadUsers(): Promise<User[]> {
    return this.usersService.getLeadUsers();
  }

  @Get('/leads/login-info')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get LEAD users with login information' })
  @ApiResponse({ status: 200, description: 'List of LEAD users with login details' })
  async getLeadUsersLoginInfo(): Promise<any[]> {
    const leadUsers = await this.usersService.getLeadUsers();
    
    return leadUsers.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      categories: user.categories,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0,
      isActive: user.isActive,
      loginReady: user.isActive && !!user.password,
      generatedPassword: user.password ? `${user.lastName.toLowerCase()}${new Date().getFullYear()}` : null
    }));
  }
} 