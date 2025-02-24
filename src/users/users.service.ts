import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getOneUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id }, 
      relations: ['leaves', 'attendance'] 
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async getAllUsers(includeAttendance: boolean): Promise<User[]> {
    const relations = includeAttendance ? ['leaves', 'attendance'] : [];
    return this.userRepository.find({ relations });
  }

  async createUser(userData: any): Promise<User> {
    if (!userData.name || !userData.surname || !userData.phoneNumber) {
      throw new BadRequestException('Required fields missing');
    }

    const newUser = this.userRepository.create({
      name: userData.name,
      surname: userData.surname,
      phoneNumber: userData.phoneNumber,
      matricule: `NJC-${Math.floor(Math.random() * 200)}`,
      publicKey: userData.publicKey || null,
      challenge: userData.challenge || null,
      counter: 0,
      created_at: new Date().toISOString(),
      leaves: userData.leaves || [],
      attendance: userData.attendance || [],
    });

    const savedUser = await this.userRepository.save(newUser);
    console.log(savedUser, 'User created successfully');
    return savedUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getOneUser(id);

    const updatedUser = this.userRepository.merge(user, userData);
    return this.userRepository.save(updatedUser);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.getOneUser(id);
    await this.userRepository.remove(user);
  }

  async findById(userId: number): Promise<User | undefined> {
    return this.userRepository.findOne({ 
      where: { id: userId }, 
      relations: ['leaves', 'attendance'] 
    });
  }

  async registerFingerprint(id: number, publicKey: string): Promise<User> {
    const user = await this.getOneUser(id);

    user.publicKey = publicKey;
    return this.userRepository.save(user);
  }

  async findByFingerprint(fingerprint: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { publicKey: fingerprint },
      relations: ['leaves', 'attendance']
    });
  }

  async getUserWithAttendanceAndLeaves(userId: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['leaves', 'attendance'],
    });
  }
}
