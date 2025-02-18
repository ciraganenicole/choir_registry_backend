import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

let userIdCounter = 1; 

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getOneUser(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async createUser(userData: any) {
    // Ensure required fields are provided
    if (!userData.name || !userData.surname || !userData.phoneNumber) {
      throw new BadRequestException('Required fields missing');
    }
  
    // Create new user object, including default values
    const newUser = this.userRepository.create({
      name: userData.name,
      surname: userData.surname,
      phoneNumber: userData.phoneNumber,
      matricule: `NJC-${Math.floor(Math.random() * 200)}`,
      publicKey: userData.publicKey || null, // Handle optional publicKey
      challenge: userData.challenge || null,  // Handle optional challenge
      counter: 0,  // Default value for counter
      created_at: new Date().toISOString(), // Handle timestamp
    });
  
    // Save user and return
    const savedUser = await this.userRepository.save(newUser);
    console.log(savedUser, 'User created successfully');
    return savedUser;
  }
  

async updateUser(id: number, user: Partial<User>): Promise<User> {
  const {id: userId, ...userData} = user; 
  const updated = await this.userRepository.update(id, userData); 
  console.log(updated,)
  const updatedUser = await this.userRepository.findOne({ where: { id } });
  return updatedUser; 
}

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

async findById(userId: number): Promise<User | undefined> {
  return this.userRepository.findOne({ where: { id: userId } });
}


  async registerFingerprint(id: number, publicKey: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('User not found');
    }

    user.publicKey = publicKey;
    return this.userRepository.save(user);
  }

  async findByFingerprint(fingerprint: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { publicKey: fingerprint } });
  }
}
