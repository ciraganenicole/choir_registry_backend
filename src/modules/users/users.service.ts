/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, SelectQueryBuilder } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserCategory } from './enums/user-category.enum';
import { UserFilterDto } from './dto/user-filter.dto';
import { Transaction } from '../transactions/transaction.entity';
import { Attendance } from '../attendance/attendance.entity';
import { TransactionType } from '../transactions/enums/transactions-categories.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>
    ) {}

    private applyUserListFilters(
        query: SelectQueryBuilder<User>,
        filterDto: UserFilterDto
    ): void {
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
            letter,
        } = filterDto;

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
    }

    async getAllUsers(filterDto: UserFilterDto): Promise<[User[], number]> {
        const { page = 1, limit = 10, sortBy = 'lastName', order = 'ASC', ...where } = filterDto;

        const data = await this.userRepository.findAndCount({
            order: {
                [sortBy]: order
            },
            skip: limit * (page - 1),
            take: limit,
            where
        })

        return data;
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

    async findByIdForAuth(id: number): Promise<User> {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.email', 
                'user.firstName', 
                'user.lastName', 
                'user.categories',
                'user.isActive', 
                'user.password'
            ])
            .where('user.id = :id', { id })
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

            // Note: User entity doesn't have a role property

            // Ensure categories always includes 'NORMAL'
            if (!userData.categories) {
                userData.categories = [UserCategory.NORMAL];
            } else if (!userData.categories.includes(UserCategory.NORMAL)) {
                userData.categories = [UserCategory.NORMAL, ...userData.categories];
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
        
        // Note: User entity doesn't have a role property
        
        // Ensure categories always includes 'NORMAL'
        if (!userData.categories) {
            userData.categories = [UserCategory.NORMAL];
        } else if (!userData.categories.includes(UserCategory.NORMAL)) {
            userData.categories = [UserCategory.NORMAL, ...userData.categories];
        }
        
        // Check if LEAD category is being added or removed
        const hadLeadCategory = oldData.categories?.includes(UserCategory.LEAD);
        const hasLeadCategory = userData.categories?.includes(UserCategory.LEAD);
        const isAddingLeadCategory = !hadLeadCategory && hasLeadCategory;
        const isRemovingLeadCategory = hadLeadCategory && !hasLeadCategory;
        
        // If LEAD category is being removed, use query builder to ensure password is cleared
        if (isRemovingLeadCategory) {
            // Only include properties that exist in the User entity
            const validUpdateData = {
                firstName: userData.firstName,
                lastName: userData.lastName,
                gender: userData.gender,
                maritalStatus: userData.maritalStatus,
                educationLevel: userData.educationLevel,
                profession: userData.profession,
                competenceDomain: userData.competenceDomain,
                churchOfOrigin: userData.churchOfOrigin,
                commune: userData.commune,
                quarter: userData.quarter,
                reference: userData.reference,
                address: userData.address,
                phoneNumber: userData.phoneNumber,
                whatsappNumber: userData.whatsappNumber,
                email: userData.email,
                phone: userData.phone,
                categories: userData.categories,
                password: undefined
            };
            
            await this.userRepository
                .createQueryBuilder()
                .update(User)
                .set(validUpdateData)
                .where("id = :id", { id: user.id })
                .execute();
            
            return await this.findById(id);
        }
        
        // Update user data
        Object.assign(user, userData);
        
        // If LEAD category is being added and user doesn't have a password, generate one
        if (isAddingLeadCategory && !user.password) {
            const plainPassword = this.generatePassword(user.lastName);
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            user.password = hashedPassword;
        }
        
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

    // Generate password for LEAD users: lastName + currentYear
    private generatePassword(lastName: string): string {
        const currentYear = new Date().getFullYear();
        return `${lastName.toLowerCase()}${currentYear}`;
    }

    // Assign LEAD category and generate password for a user
    async assignLeadRole(userId: number): Promise<{ user: User; password: string }> {
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with id ${userId} not found`);
        }

        // Check if user already has LEAD category
        const hasLeadCategory = user.categories?.includes(UserCategory.LEAD);
        
        // If user already has LEAD category and password, return existing info
        if (hasLeadCategory && user.password) {
            // Generate the same password to return it
            const plainPassword = this.generatePassword(user.lastName);
            return {
                user: user,
                password: plainPassword
            };
        }

        // Generate password (for users without password or without LEAD category)
        const plainPassword = this.generatePassword(user.lastName);
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Prepare update data
        const updateData: any = {
            password: hashedPassword
        };

        // If user doesn't have LEAD category, add it
        if (!hasLeadCategory) {
            const updatedCategories = user.categories ? [...user.categories, UserCategory.LEAD] : [UserCategory.LEAD];
            updateData.categories = updatedCategories;
        }

        // Use query builder for more reliable update
        const updateResult = await this.userRepository
            .createQueryBuilder()
            .update(User)
            .set(updateData)
            .where("id = :id", { id: userId })
            .execute();

        // Verify the update was successful
        if (updateResult.affected === 0) {
            throw new BadRequestException('Failed to update user. No rows were affected.');
        }

        // Return updated user and plain password
        const updatedUser = await this.findById(userId);
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }

        return {
            user: updatedUser,
            password: plainPassword
        };
    }

    // Remove LEAD category and clear password
    async removeLeadRole(userId: number): Promise<User> {
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException(`User with id ${userId} not found`);
        }

        // Check if user has LEAD category
        if (!user.categories?.includes(UserCategory.LEAD)) {
            throw new BadRequestException('User does not have LEAD category');
        }

        // Remove LEAD category and clear password
        const updatedCategories = user.categories.filter(cat => cat !== UserCategory.LEAD);
        
        // Use query builder for more reliable update
        const updateResult = await this.userRepository
            .createQueryBuilder()
            .update(User)
            .set({
                categories: updatedCategories,
                password: undefined
            })
            .where("id = :id", { id: userId })
            .execute();

        // Verify the update was successful
        if (updateResult.affected === 0) {
            throw new BadRequestException('Failed to update user. No rows were affected.');
        }

        return await this.findById(userId);
    }

    async validateUserCredentials(email: string, password: string): Promise<User | null> {
        const user = await this.findByEmail(email);
        if (!user || !user.isActive || !user.password) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        return isPasswordValid ? user : null;
    }

    async getLeadUsers(): Promise<User[]> {
        return this.userRepository
            .createQueryBuilder('user')
            .where('user.categories @> ARRAY[:leadCategory]', { leadCategory: UserCategory.LEAD })
            .orderBy('user.lastName', 'ASC')
            .getMany();
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async getLeadUsersLoginInfo(): Promise<
        Array<{
            id: number;
            firstName: string;
            lastName: string;
            email: string | null;
            categories: UserCategory[];
            hasPassword: boolean;
            passwordLength: number;
            isActive: boolean;
            loginReady: boolean;
            generatedPassword: string | null;
        }>
    > {
        const currentYear = new Date().getFullYear();
        const rows = await this.userRepository
            .createQueryBuilder('user')
            .select('user.id', 'id')
            .addSelect('user.firstName', 'firstName')
            .addSelect('user.lastName', 'lastName')
            .addSelect('user.email', 'email')
            .addSelect('user.categories', 'categories')
            .addSelect('user.isActive', 'isActive')
            .addSelect('CASE WHEN user.password IS NOT NULL THEN true ELSE false END', 'hasPassword')
            .addSelect('COALESCE(LENGTH(user.password), 0)', 'passwordLength')
            .where('user.categories @> ARRAY[:leadCategory]', { leadCategory: UserCategory.LEAD })
            .orderBy('user.lastName', 'ASC')
            .getRawMany();

        return rows.map((row: Record<string, unknown>) => {
            const lastName = String(row.lastname ?? row.lastName ?? '');
            const hasPassword = Boolean(row.haspassword ?? row.hasPassword);
            const passwordLength = Number(row.passwordlength ?? row.passwordLength ?? 0);
            const categories = (row.categories ?? row.user_categories) as UserCategory[];
            return {
                id: Number(row.id ?? row.user_id),
                firstName: String(row.firstname ?? row.firstName ?? ''),
                lastName,
                email: row.email != null ? String(row.email) : null,
                categories: Array.isArray(categories) ? categories : [],
                hasPassword,
                passwordLength,
                isActive: Boolean(row.isactive ?? row.isActive),
                loginReady: Boolean(row.isactive ?? row.isActive) && hasPassword,
                generatedPassword: hasPassword ? `${lastName.toLowerCase()}${currentYear}` : null,
            };
        });
    }

    async getUserContributionStats(
        userId: number,
        startDate?: Date,
        endDate?: Date
    ): Promise<{
        totalContributions: number;
        contributionsByCategory: Record<string, number>;
        monthlyBreakdown: Record<string, number>;
        transactionCount: number;
        dateRange: { from: Date | null; to: Date | null };
    }> {
        const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

        const base = this.transactionRepository
            .createQueryBuilder('transaction')
            .where('transaction.contributorId = :userId', { userId })
            .andWhere('transaction.type = :type', { type: TransactionType.INCOME });

        if (startDate) {
            base.andWhere('transaction.transactionDate >= :startDate', {
                startDate: toDateStr(new Date(startDate)),
            });
        }
        if (endDate) {
            base.andWhere('transaction.transactionDate <= :endDate', {
                endDate: toDateStr(new Date(endDate)),
            });
        }

        const totalRow = await base
            .clone()
            .select('COALESCE(SUM("transaction"."amount"), 0)', 'total')
            .addSelect('COUNT(*)', 'cnt')
            .getRawOne();

        const totalContributions = Number(totalRow?.total ?? 0);
        const transactionCount = Number(totalRow?.cnt ?? 0);

        const categoryRows = await base
            .clone()
            .select('transaction.category', 'category')
            .addSelect('SUM("transaction"."amount")', 'sum')
            .groupBy('transaction.category')
            .getRawMany();

        const contributionsByCategory: Record<string, number> = {};
        for (const row of categoryRows) {
            contributionsByCategory[String(row.category)] = Number(row.sum);
        }

        let monthlyBreakdown: Record<string, number> = {};
        if (startDate && endDate) {
            const monthlyRows = await base
                .clone()
                .select(`TO_CHAR("transaction"."transactionDate", 'YYYY-MM')`, 'month')
                .addSelect('SUM("transaction"."amount")', 'sum')
                .groupBy(`TO_CHAR("transaction"."transactionDate", 'YYYY-MM')`)
                .addOrderBy(`TO_CHAR("transaction"."transactionDate", 'YYYY-MM')`, 'ASC')
                .getRawMany();
            for (const row of monthlyRows) {
                monthlyBreakdown[String(row.month)] = Number(row.sum);
            }
        }

        return {
            totalContributions,
            contributionsByCategory,
            monthlyBreakdown,
            transactionCount,
            dateRange: {
                from: startDate ? new Date(startDate) : null,
                to: endDate ? new Date(endDate) : null,
            },
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
