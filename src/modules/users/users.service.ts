/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserCategory } from './enums/user-category.enum';
import { UserFilterDto } from './dto/user-filter.dto';
import { v2 as cloudinary } from 'cloudinary';
import { Transaction } from '../transactions/transaction.entity';
import { ConfigService } from '@nestjs/config';
import { TransactionType } from '../transactions/enums/transactions-categories.enum';

@Injectable()
export class UsersService implements OnModuleInit {
    private cloudinaryConfigured = false;

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly configService: ConfigService
    ) {}

    onModuleInit() {
        const cloudName = this.configService.get<string>('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
        const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error('Cloudinary configuration is missing');
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });

        this.cloudinaryConfigured = true;
    }

    private async handleProfileImage(userId: number, imageUrl: string): Promise<string> {
        try {
            // Extract public_id from the URL
            const match = imageUrl.match(/\/v\d+\/([^/]+)\.[^.]+$/);
            if (!match) {
                throw new BadRequestException('Invalid Cloudinary URL format');
            }

            const publicId = match[1];
            if (!publicId) {
                throw new BadRequestException('Could not extract public ID from URL');
            }

            // Generate the optimized URL
            return cloudinary.url(publicId, {
                secure: true,
                transformation: [
                    { width: 400, height: 400, crop: 'fill' },
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            });
        } catch (error: unknown) {
            console.error('Error handling profile image:', error);
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to handle profile image');
        }
    }

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

        // Apply filters
        if (search) {
            query.andWhere(
                '(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.phoneNumber) LIKE LOWER(:search))',
                { search: `%${search}%` }
            );
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

        if (letter) {
            query.andWhere('LOWER(user.firstName) LIKE LOWER(:letter)', { letter: `${letter}%` });
        }

        // Apply sorting and pagination
        query.orderBy(`user.${sortBy}`, order)
            .skip((page - 1) * limit)
            .take(limit);

        const [users, total] = await query.getManyAndCount();

        // If we need related data, fetch it separately to avoid join issues
        if (users.length > 0) {
            const usersWithRelations = await Promise.all(
                users.map(async (user) => {
                    return await this.findById(user.id);
                })
            );
            return [usersWithRelations, total];
        }

        return [users, total];
    }

    async findById(id: number): Promise<User> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.attendances', 'attendance')
            .leftJoinAndSelect('user.leaves', 'leave')
            .leftJoinAndSelect('user.transactions', 'transaction')
            .where('user.id = :id', { id })
            .orderBy({
                'attendance.date': 'DESC',
                'attendance.startTime': 'ASC',
                'leave.startDate': 'DESC',
                'transaction.transactionDate': 'DESC'
            })
            .getOne();

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async getUserWithAttendanceAndLeaves(userId: number): Promise<User> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.attendances', 'attendance')
            .leftJoinAndSelect('user.leaves', 'leave')
            .leftJoinAndSelect('user.transactions', 'transaction')
            .where('user.id = :userId', { userId })
            .orderBy({
                'attendance.date': 'DESC',
                'attendance.startTime': 'ASC',
                'leave.startDate': 'DESC',
                'transaction.transactionDate': 'DESC'
            })
            .getOne();

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return user;
    }

    async createUser(userData: CreateUserDto): Promise<User> {
        const user = this.userRepository.create(userData);
        return this.userRepository.save(user);
    }

    async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        Object.assign(user, userData);
        return this.userRepository.save(user);
    }

    async deleteUser(id: number): Promise<void> {
        const user = await this.findById(id);
        await this.userRepository.remove(user);
    }

    async getUsersByCategory(category: UserCategory): Promise<User[]> {
        return this.userRepository.find({
            where: { categories: category },
            relations: ['attendances', 'leaves', 'transactions'],
            order: {
                firstName: 'ASC',
                lastName: 'ASC'
            }
        });
    }

    async getUserTransactions(userId: number, startDate?: Date, endDate?: Date): Promise<Transaction[]> {
        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction')
            .where('transaction.contributorId = :userId', { userId });

        if (startDate && endDate) {
            queryBuilder.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate
            });
        }

        return queryBuilder
            .orderBy('transaction.transactionDate', 'DESC')
            .getMany();
    }

    async findAll(filterDto: UserFilterDto): Promise<[User[], number]> {
        const { search, gender, maritalStatus, educationLevel, profession, commune, commission, category, page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC', letter } = filterDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.attendances', 'attendance')
            .leftJoinAndSelect('user.leaves', 'leave')
            .leftJoinAndSelect('user.transactions', 'transaction');

        if (search) {
            queryBuilder.andWhere(
                '(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR LOWER(user.phoneNumber) LIKE LOWER(:search))',
                { search: `%${search}%` }
            );
        }

        if (letter) {
            queryBuilder.andWhere('LOWER(user.lastName) LIKE LOWER(:letter)', { letter: `${letter}%` });
        }

        if (gender) {
            queryBuilder.andWhere('user.gender = :gender', { gender });
        }

        if (maritalStatus) {
            queryBuilder.andWhere('user.maritalStatus = :maritalStatus', { maritalStatus });
        }

        if (educationLevel) {
            queryBuilder.andWhere('user.educationLevel = :educationLevel', { educationLevel });
        }

        if (profession) {
            queryBuilder.andWhere('user.profession = :profession', { profession });
        }

        if (commune) {
            queryBuilder.andWhere('user.commune = :commune', { commune });
        }

        if (commission) {
            queryBuilder.andWhere(':commission = ANY(user.commissions)', { commission });
        }

        if (category) {
            queryBuilder.andWhere(':category = ANY(user.categories)', { category });
        }

        queryBuilder
            .orderBy(`user.${sortBy}`, order)
            .addOrderBy('attendance.date', 'DESC')
            .addOrderBy('attendance.startTime', 'ASC')
            .addOrderBy('leave.startDate', 'DESC')
            .addOrderBy('transaction.transactionDate', 'DESC')
            .skip(skip)
            .take(limit);

        return queryBuilder.getManyAndCount();
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['attendances', 'leaves', 'transactions']
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async findByCategory(category: string): Promise<User[]> {
        return this.userRepository.find({
            where: {
                categories: In([category])
            },
            relations: ['attendances', 'leaves', 'transactions']
        });
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);
        Object.assign(user, updateUserDto);
        return this.userRepository.save(user);
    }

    async remove(id: number): Promise<void> {
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
    }

    async findByEmail(email: string): Promise<User | undefined> {
        const user = await this.userRepository.findOne({ where: { email } });
        return user || undefined;
    }

    async getUserContributionStats(userId: number): Promise<any> {
        const transactions = await this.transactionRepository.find({
            where: {
                contributorId: userId,
                type: TransactionType.INCOME
            }
        });

        const totalContributions = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const contributionsByCategory = transactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
            return acc;
        }, {} as Record<string, number>);

        return {
            totalContributions,
            contributionsByCategory,
            transactionCount: transactions.length
        };
    }

    async searchUsers(query: string): Promise<User[]> {
        return this.userRepository.find({
            where: [
                { firstName: Like(`%${query}%`) },
                { lastName: Like(`%${query}%`) },
                { email: Like(`%${query}%`) },
                { phoneNumber: Like(`%${query}%`) }
            ],
            take: 10
        });
    }

    async findByIds(ids: number[]): Promise<User[]> {
        return this.userRepository.find({
            where: { id: In(ids) }
        });
    }
}
