/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from '../../common/dtos/user.dto';
import { UserCategory } from './user-category.enum';
import { Event } from '../events/event.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) {}

    async getAllUsers(): Promise<User[]> {
        return this.userRepository.find({
            relations: ['attendance', 'attendance.event', 'leaves'],
            order: {
                name: 'ASC',
                surname: 'ASC'
            }
        });
    }

    async getOneUser(id: number): Promise<User> {
        const user = await this.userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.attendance', 'attendance')
            .leftJoinAndSelect('attendance.event', 'event')
            .leftJoinAndSelect('user.leaves', 'leaves')
            .where('user.id = :id', { id })
            .orderBy('attendance.date', 'DESC') // Order by attendance date
            .addOrderBy('leaves.startDate', 'DESC') // Order by leave start date
            .getOne();
    
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    

    async createUser(userData: CreateUserDto): Promise<User> {
        const categories = Array.isArray(userData.categories) 
            ? userData.categories.filter((c) => c !== undefined) 
            : [userData.categories].filter((c) => c !== undefined);
    
        const user = this.userRepository.create({
            ...userData,
            categories
        });
    
        return this.userRepository.save(user);
    }
    async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
        const user = await this.getOneUser(id);

        if (userData.categories) {
            userData.categories = Array.isArray(userData.categories) 
                ? userData.categories 
                : [userData.categories];
        }

        const updatedUser = {
            ...user,
            ...userData
        };

        await this.userRepository.save(updatedUser);
        return this.getOneUser(id);
    }

    async deleteUser(id: number): Promise<void> {
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }

    async getUsersByCategory(category: UserCategory): Promise<User[]> {
        return this.userRepository.find({
            where: { categories: category },
            relations: ['attendance', 'attendance.event', 'leaves'],
            order: {
                name: 'ASC',
                surname: 'ASC'
            }
        });
    }

    async registerFingerprint(userId: number, fingerprintData: string): Promise<User> {
        const user = await this.getOneUser(userId);
        user.fingerprintData = fingerprintData;
        return this.userRepository.save(user);
    }

    async findById(id: number): Promise<User> {
        return this.getOneUser(id);
    }

    async getUserWithAttendanceAndLeaves(userId: number): Promise<User> {
        const user = await this.userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.attendance', 'attendance')
            .leftJoinAndSelect('attendance.event', 'event')
            .leftJoinAndSelect('user.leaves', 'leaves')
            .where('user.id = :id', { id: userId })
            .orderBy('attendance.date', 'DESC')  // Correct ordering by attendance date
            .addOrderBy('leaves.startDate', 'DESC') // Correct ordering by leaves startDate
            .getOne();
    
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }
    
        return user;
    }
    

    async getUsersByEventType(eventType: Event['type']): Promise<User[]> {
        return this.userRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.attendance', 'attendance')
            .leftJoinAndSelect('attendance.event', 'event')
            .where('event.type = :eventType', { eventType })
            .orderBy('user.name', 'ASC')
            .addOrderBy('user.surname', 'ASC')
            .getMany();
    }
}
