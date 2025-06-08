/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, BadRequestException, OnModuleInit, ConflictException } from '@nestjs/common';
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
import { UserRole } from './enums/role.enum';
import { RegisterUserDto } from '../../common/dtos/auth.dto';

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

    private async handleProfileImage(userId: string, imageUrl: string): Promise<string> {
        try {
            const match = imageUrl.match(/\/v\d+\/([^/]+)\.[^.]+$/);
            if (!match) {
                throw new BadRequestException('Invalid Cloudinary URL format');
            }

            const publicId = match[1];
            if (!publicId) {
                throw new BadRequestException('Could not extract public ID from URL');
            }

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

        query.orderBy(`user.${sortBy}`, order)
            .skip((page - 1) * limit)
            .take(limit);

        const [users, total] = await query.getManyAndCount();

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

    async findById(id: string): Promise<User> {
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

    async createUser(userData: CreateUserDto | RegisterUserDto): Promise<User> {
        const queryRunner = this.userRepository.manager.connection.createQueryRunner();
        
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            const user = this.userRepository.create({
                ...userData,
                role: 'role' in userData ? userData.role : UserRole.CHOIR_MEMBER,
                isActive: true
            });

            const savedUser = await queryRunner.manager.save(user);
            
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

    async updateUser(id: string, userData: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        Object.assign(user, userData);
        return this.userRepository.save(user);
    }

    async deleteUser(id: string): Promise<void> {
        const user = await this.findById(id);
        await this.userRepository.remove(user);
    }

    async getUsersByCategory(category: UserCategory): Promise<User[]> {
        return this.userRepository.find({
            where: { categories: category },
            relations: ['attendances', 'transactions'],
            order: {
                firstName: 'ASC',
                lastName: 'ASC'
            }
        });
    }

    async getUserTransactions(userId: string, startDate?: Date, endDate?: Date): Promise<Transaction[]> {
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

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async findUserByEmail(email: string): Promise<User> {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }
        return user;
    }

    async getUserContributionStats(userId: string, startDate?: Date, endDate?: Date): Promise<any> {
        const queryBuilder = this.transactionRepository
            .createQueryBuilder('transaction')
            .where('transaction.contributorId = :userId', { userId })
            .andWhere('transaction.type = :type', { type: TransactionType.INCOME });

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

        let monthlyBreakdown = {};
        if (startDate && endDate) {
            monthlyBreakdown = transactions.reduce((acc, t) => {
                const monthYear = t.transactionDate.toString().slice(0, 7);
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

    async findByIds(ids: string[]): Promise<User[]> {
        return this.userRepository.find({
            where: { id: In(ids) }
        });
    }
}
