import {
  Controller,
  Get,
  Post,
  Body,
  NotFoundException,
  Param,
  Put,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Get user by ID
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.getOneUser(userId);
  }

  // Get all users
  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }

  // Create a new user
  @Post()
  async create(@Body() userData: any): Promise<User> {
    console.log('Creating user with data:', userData);
    return this.usersService.createUser(userData);
  }

  // Update user information
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() user: Partial<User>,
  ): Promise<User> {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.usersService.updateUser(userId, user);
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

  // Register a user's fingerprint
  @Post(':id/fingerprint')
  async registerFingerprint(
    @Param('id') id: string,
    @Body('publicKey') publicKey: string,
  ): Promise<User> {
    const userId = parseInt(id, 10);
    if (isNaN(userId) || !publicKey) {
      throw new BadRequestException('Invalid user ID or missing publicKey');
    }

    return this.usersService.registerFingerprint(userId, publicKey);
  }

  // Find a user by fingerprint
  @Post('fingerprint')
  async findByFingerprint(@Body('fingerprint') fingerprint: string): Promise<User> {
    if (!fingerprint) {
      throw new BadRequestException('Fingerprint is required');
    }

    const user = await this.usersService.findByFingerprint(fingerprint);
    if (!user) {
      throw new NotFoundException('User with this fingerprint not found');
    }
    return user;
  }
}
