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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { UserCategory } from './enums/user-category.enum';
import { API_ROUTES } from '../../common/routes/api.routes';
import { UserFilterDto } from '../../common/dtos/user-filter.dto';
import { Transaction } from '../transactions/transaction.entity';

@ApiTags('Users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(API_ROUTES.USERS.BASE)
  @ApiOperation({ summary: 'Get all users with filters and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false })
  @ApiQuery({ name: 'letter', required: false })
  async getUsers(
    @Query(ValidationPipe) filterDto: UserFilterDto
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
  @UsePipes(new ValidationPipe({ transform: true }))
  async createUser(@Body() userData: CreateUserDto): Promise<User> {
    return this.usersService.createUser(userData);
  }

  @Put(API_ROUTES.USERS.BY_ID)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: UpdateUserDto
  ): Promise<User> {
    return this.usersService.updateUser(id, userData);
  }

  @Delete(API_ROUTES.USERS.BY_ID)
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.usersService.deleteUser(id);
    return { message: 'User deleted successfully' };
  }

  @Get(API_ROUTES.USERS.BY_CATEGORY)
  @ApiParam({ name: 'category', enum: UserCategory })
  async getUsersByCategory(@Param('category') category: UserCategory): Promise<User[]> {
    return this.usersService.getUsersByCategory(category);
  }

  @Get(API_ROUTES.USERS.TRANSACTIONS)
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiParam({ name: 'id', type: Number })
  async getUserTransactions(@Param('id', ParseIntPipe) id: number): Promise<Transaction[]> {
    return this.usersService.getUserTransactions(id);
  }
} 