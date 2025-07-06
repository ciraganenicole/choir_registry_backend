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
import { Attendance } from '../attendance/attendance.entity';
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
            isActive, 
            page = 1, 
            limit = 8, 
            sortBy = 'lastName', 
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

        if (isActive !== undefined && isActive !== null) {
            query.andWhere('user.isActive = :isActive', { isActive: Boolean(isActive) });
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
            .leftJoinAndSelect('user.transactions', 'transaction')
            .where('user.id = :id', { id })
            .orderBy({
                'attendance.date': 'DESC',
                'transaction.transactionDate': 'DESC'
            })
            .getOne();

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async getUserWithAttendanceAndTransactions(userId: number): Promise<User> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.attendances', 'attendance')
            .leftJoinAndSelect('user.transactions', 'transaction')
            .where('user.id = :userId', { userId })
            .orderBy({
                'attendance.date': 'DESC',
                'transaction.transactionDate': 'DESC'
            })
            .getOne();

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return user;
    }

    async createUser(userData: CreateUserDto): Promise<User> {
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            // Set isActive to false if user is a NEWCOMER
            if (userData.categories?.includes(UserCategory.NEWCOMER)) {
                userData.isActive = false;
            }

            const user = this.userRepository.create(userData);
            const savedUser = await queryRunner.manager.save(user);
            
            // Generate matricule
            if (savedUser.id) {
                const year = savedUser.joinDate ? savedUser.joinDate.getFullYear() : new Date().getFullYear();
                savedUser.matricule = `NJC-${savedUser.id}-${year}`;
                await queryRunner.manager.update(User, savedUser.id, { matricule: savedUser.matricule });
            }

            await queryRunner.commitTransaction();
            return savedUser;
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        const oldData = { ...user };
        Object.assign(user, userData);
        const updatedUser = await this.userRepository.save(user);

        return updatedUser;
    }

    async deleteUser(id: number): Promise<void> {
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            // Find the user with relations
            const user = await queryRunner.manager.findOne(User, {
                where: { id },
                relations: ['transactions', 'attendances']
            });

            if (!user) {
                throw new NotFoundException(`User with ID ${id} not found`);
            }

            // Delete related transactions first
            if (user.transactions && user.transactions.length > 0) {
                await queryRunner.manager.remove(Transaction, user.transactions);
            }

            // Delete related attendances
            if (user.attendances && user.attendances.length > 0) {
                await queryRunner.manager.remove(Attendance, user.attendances);
            }

            // Finally delete the user
            await queryRunner.manager.remove(User, user);

            await queryRunner.commitTransaction();
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getUsersByCategory(category: UserCategory): Promise<User[]> {
        return this.userRepository.find({
            where: {
                categories: In([category])
            },
            relations: ['attendances', 'transactions'],
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
        const { page = 1, limit = 10, search, sortBy = 'lastName', order = 'ASC' } = filterDto;
        const skip = (page - 1) * limit;

        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.attendances', 'attendance')
            .leftJoinAndSelect('user.transactions', 'transaction');

        if (search) {
            queryBuilder.andWhere(
                '(LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search) OR LOWER(user.matricule) LIKE LOWER(:search))',
                { search: `%${search}%` }
            );
        }

        if (sortBy) {
            queryBuilder.orderBy(`user.${sortBy}`, order);
        }

        queryBuilder
            .addOrderBy('attendance.date', 'DESC')
            .addOrderBy('transaction.transactionDate', 'DESC')
            .skip(skip)
            .take(limit);

        return queryBuilder.getManyAndCount();
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
            relations: ['attendances', 'transactions']
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async findByCategory(category: string): Promise<User[]> {
        return this.userRepository.createQueryBuilder('user')
            .where(':category = ANY(user.categories)', { category })
            .leftJoinAndSelect('user.attendances', 'attendance')
            .leftJoinAndSelect('user.transactions', 'transaction')
            .getMany();
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

    async getUserContributionStats(userId: number, startDate?: Date, endDate?: Date): Promise<any> {
        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction')
            .where('transaction.contributorId = :userId', { userId })
            .andWhere('transaction.type = :type', { type: TransactionType.INCOME });

        // Add date filtering if dates are provided
        if (startDate) {
            queryBuilder.andWhere('transaction.transactionDate >= :startDate', { 
                startDate: new Date(startDate) 
            });
        }
        if (endDate) {
            queryBuilder.andWhere('transaction.transactionDate <= :endDate', { 
                endDate: new Date(endDate) 
            });
        }

        const transactions = await queryBuilder.getMany();

        const totalContributions = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const contributionsByCategory = transactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
            return acc;
        }, {} as Record<string, number>);

        // Add monthly breakdown if date range is provided
        let monthlyBreakdown = {};
        if (startDate && endDate) {
            monthlyBreakdown = transactions.reduce((acc, t) => {
                const monthYear = t.transactionDate.toString().slice(0, 7); // Format: YYYY-MM
                acc[monthYear] = (acc[monthYear] || 0) + Number(t.amount);
                return acc;
            }, {} as Record<string, number>);
        }

        return {
            totalContributions,
            contributionsByCategory,
            monthlyBreakdown,
            transactionCount: transactions.length,
            dateRange: {
                from: startDate ? new Date(startDate) : null,
                to: endDate ? new Date(endDate) : null
            }
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
