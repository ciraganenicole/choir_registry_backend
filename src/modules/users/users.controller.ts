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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from '../../common/dtos/user.dto';
import { UsersService } from './users.service';
import { UserCategory } from './user-category.enum';
import { API_ROUTES } from '../../common/routes/api.routes';

@ApiTags('Users')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(API_ROUTES.USERS.BASE)
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'includeAttendance', required: false, type: Boolean })
  async getUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }

  @Get(API_ROUTES.USERS.BY_ID)
  @ApiOperation({ summary: 'Get user by ID with attendance history' })
  @ApiParam({ name: 'id', type: Number })
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.getUserWithAttendanceAndLeaves(id);
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
} 