import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

let userIdCounter = 1; 

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.users = [];
  }

  private users: User[];

  async getOneUser(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

async createUser(userData: any) {
  const newUser = {
    id: userIdCounter++, 
    created_at: new Date().toISOString(), 
    key: userData.key || null, 
    ...userData,
  };
  newUser.matricule = `NJC-${newUser.id}`;

  const res = await this.userRepository.save(this.userRepository.create(newUser));
  console.log(res, 'lelelel')
  return newUser;
}

async updateUser(id: number, user: Partial<User>): Promise<User> {
  const {id: userId, ...userData} = user;  // Extract the ID from the user object
  const updated = await this.userRepository.update(id, userData);  // Perform the update
  console.log(updated,)
  console.log(user, 'User')
  const updatedUser = await this.userRepository.findOne({ where: { id } });  // Retrieve the updated user
  console.log(updatedUser, 'Updated User');
  return updatedUser;  // Return the updated user
}

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
