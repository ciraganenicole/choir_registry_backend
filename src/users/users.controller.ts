import { Controller, Get, Post, Body, NotFoundException, Param, Put, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

   //get user by id
   @Get(':id')
   async findOne(@Param('id') id: number): Promise<User> {
     const user = await this.usersService.getOneUser(id);
     if (!user) {
       throw new NotFoundException('User does not exist!');
     } else {
       return user;
     }
   }

   //get all users
   @Get()
  async getAllUsers(): Promise<User[]> {
    return await this.usersService.getAllUsers();
  }
 
   //create user
   @Post()
async create(@Body() userData: any): Promise<User> {
  console.log(userData); // Check the structure of userData here
  return this.usersService.createUser(userData);
}
 
   //update user
   @Put(':id')
   async update (@Param('id') id: number, @Body() user: User): Promise<any> {
     return this.usersService.updateUser(id, user);
   }
 
   //delete user
   @Delete(':id')
   async delete(@Param('id') id: number): Promise<any> {
     const user = await this.usersService.getOneUser(id);
     if (!user) {
       throw new NotFoundException('User does not exist!');
     }
     return this.usersService.deleteUser(id);
   }
}
