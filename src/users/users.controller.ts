import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  BadRequestException,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get all users with optional attendance
  @Get()
  async getUsers(@Query('includeAttendance') includeAttendance?: string): Promise<User[]> {
    const include = includeAttendance === 'true';
    return this.usersService.getAllUsers(include);
  }

  // Get a specific user by ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.getOneUser(userId);
  }

  // Create a new user
  @Post()
  async create(@Body() userData: any): Promise<User> {
    return this.usersService.createUser(userData);
  }

  // Update user information
  @Put(':id')
  async update(@Param('id') id: string, @Body() userData: Partial<User>): Promise<User> {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.updateUser(userId, userData);
  }

  // Delete a user
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    await this.usersService.deleteUser(userId);
    return { message: 'User deleted successfully' };
  }
}