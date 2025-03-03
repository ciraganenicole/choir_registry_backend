/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto } from '../../common/dtos/user.dto';
import { UserCategory } from './enums/user-category.enum';
import { Event } from '../events/event.entity';
import { UserFilterDto } from '../../common/dtos/user-filter.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>
    ) {}

    async getAllUsers(filterDto: UserFilterDto): Promise<[User[], number]> {
        const {
            search,
            gender,
            maritalStatus,
            educationLevel,
            profession,
            commune,
            commission,
            category,
            page = 1,
            limit = 10,
            sortBy = 'firstName',
            order = 'ASC',
            letter
        } = filterDto;

        const query = this.userRepository.createQueryBuilder('user');

        // Add relations
        query.leftJoinAndSelect('user.attendance', 'attendance')
             .leftJoinAndSelect('attendance.event', 'event')
             .leftJoinAndSelect('user.leaves', 'leaves');

        // Apply filters
        if (search) {
            query.andWhere(
                '(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
                { search: `%${search}%` }
            );
        }

        if (letter) {
            query.andWhere('LOWER(user.firstName) LIKE LOWER(:letter)', { letter: `${letter}%` });
        }

        if (gender) {
            query.andWhere('user.gender = :gender', { gender });
        }

        if (maritalStatus) {
            query.andWhere('user.maritalStatus = :maritalStatus', { maritalStatus });
        }

        if (educationLevel) {
            query.andWhere('user.educationLevel = :educationLevel', { educationLevel });
        }

        if (profession) {
            query.andWhere('user.profession = :profession', { profession });
        }

        if (commune) {
            query.andWhere('user.commune = :commune', { commune });
        }

        if (commission) {
            query.andWhere(':commission = ANY(user.commissions)', { commission });
        }

        if (category) {
            query.andWhere(':category = ANY(user.categories)', { category });
        }

        // Apply sorting
        if (sortBy) {
            query.orderBy(`user.${sortBy}`, order);
        }

        // Apply pagination
        query.skip((page - 1) * limit)
             .take(limit);

        const [users, total] = await query.getManyAndCount();
        return [users, total];
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
                firstName: 'ASC',
                lastName: 'ASC'
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
            .orderBy('user.firstName', 'ASC')
            .addOrderBy('user.lastName', 'ASC')
            .getMany();
    }
}
