import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Transaction } from './transaction.entity';
import { CreateTransactionDto, TransactionFilterDto } from '../../common/dtos/transaction.dto';
import { TransactionType, isCategoryValidForType } from './transactions-categories.enum';
import { User } from '../users/user.entity';
import { Currency } from './transaction.entity';
import { DailyContributionFilterDto,  } from './dto/daily-contribution.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = new Transaction();
    
    // Copy basic fields
    Object.assign(transaction, {
      amount: createTransactionDto.amount,
      type: createTransactionDto.type,
      category: createTransactionDto.category,
      subcategory: createTransactionDto.subcategory,
      description: createTransactionDto.description,
      transactionDate: createTransactionDto.transactionDate,
    });

    // Handle contributor (either internal or external)
    if (createTransactionDto.contributorId) {
      const contributor = await this.userRepository.findOne({
        where: { id: createTransactionDto.contributorId },
      });
      if (!contributor) {
        throw new NotFoundException('Contributor not found');
      }
      transaction.contributor = contributor;
    } else if (
      createTransactionDto.externalContributorName &&
      createTransactionDto.externalContributorPhone
    ) {
      transaction.externalContributorName = createTransactionDto.externalContributorName;
      transaction.externalContributorPhone = createTransactionDto.externalContributorPhone;
    } else if (transaction.type === TransactionType.INCOME) {
      throw new BadRequestException(
        'Either contributorId or external contributor details are required for income transactions',
      );
    }

    return this.transactionRepository.save(transaction);
  }

  async findAll(filters: any, pagination: { page: number; limit: number }) {
    const skip = (pagination.page - 1) * pagination.limit;
    const query = this.transactionRepository.createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contributor', 'contributor')
      .select([
        'transaction.id',
        'transaction.amount',
        'transaction.currency',
        'transaction.type',
        'transaction.category',
        'transaction.transactionDate',
        'contributor.id',
        'contributor.firstName',
        'contributor.lastName'
      ])
      .skip(skip)
      .take(pagination.limit)
      .orderBy('transaction.transactionDate', 'DESC');

    if (filters.type) {
      query.andWhere('transaction.type = :type', { type: filters.type });
    }

    if (filters.category) {
      query.andWhere('transaction.category = :category', { category: filters.category });
    }

    if (filters.startDate && filters.endDate) {
      query.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async generateReport(filters: TransactionFilterDto): Promise<any> {
    const query = this.transactionRepository.createQueryBuilder('transaction');

    if (filters.startDate && filters.endDate) {
      query.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
    }

    if (filters.type) {
      query.andWhere('transaction.type = :type', { type: filters.type });
    }

    if (filters.category) {
      if (filters.type && !isCategoryValidForType(filters.category, filters.type)) {
        throw new BadRequestException('Invalid category for the specified transaction type');
      }
      query.andWhere('transaction.category = :category', { category: filters.category });
    }

    if (filters.contributorId) {
      query.andWhere('transaction.contributorId = :contributorId', { 
        contributorId: filters.contributorId 
      });
    }

    const summary = await query
      .select([
        'transaction.category',
        'transaction.type',
        'SUM(transaction.amount) as total',
        'COUNT(*) as count'
      ])
      .groupBy('transaction.category, transaction.type')
      .getRawMany();

    const total = await query
      .select('SUM(transaction.amount)', 'total')
      .getRawOne();

    return {
      summary,
      total: total.total || 0,
      filters
    };
  }

  async getUserContributions(
    userId: number,
    filters: TransactionFilterDto
  ): Promise<any> {
    const query = this.transactionRepository.createQueryBuilder('transaction')
      .where('transaction.contributorId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: TransactionType.INCOME });

    if (filters.startDate && filters.endDate) {
      query.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
    }

    if (filters.category) {
      if (!isCategoryValidForType(filters.category, TransactionType.INCOME)) {
        throw new BadRequestException('Invalid category for income transactions');
      }
      query.andWhere('transaction.category = :category', { category: filters.category });
    }

    const contributions = await query
      .select([
        'transaction.category',
        'SUM(transaction.amount) as total',
        'COUNT(*) as count'
      ])
      .groupBy('transaction.category')
      .getRawMany();

    const total = await query
      .select('SUM(transaction.amount)', 'total')
      .getRawOne();

    return {
      contributions,
      total: total.total || 0,
      filters
    };
  }

  async getStats() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

    const [currentMonthTransactions, lastMonthTransactions] = await Promise.all([
      this.transactionRepository.find({
        where: {
          transactionDate: Between(
            firstDayOfMonth.toISOString().split('T')[0],
            lastDayOfMonth.toISOString().split('T')[0]
          )
        },
        select: ['amount', 'type', 'currency', 'category']
      }),
      this.transactionRepository.find({
        where: {
          transactionDate: Between(
            firstDayOfLastMonth.toISOString().split('T')[0],
            firstDayOfMonth.toISOString().split('T')[0]
          )
        },
        select: ['amount', 'type', 'currency']
      })
    ]);

    return {
      currentMonth: currentMonthTransactions,
      lastMonth: lastMonthTransactions
    };
  }

  async getDailyContributions(filters: DailyContributionFilterDto) {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contributor', 'contributor')
      .where('transaction.category = :category', { category: 'DAILY' })
      .andWhere('transaction.type = :type', { type: TransactionType.INCOME });

    if (filters.startDate && filters.endDate) {
      query.andWhere('transaction.transactionDate BETWEEN :start AND :end', {
        start: filters.startDate,
        end: filters.endDate,
      });
    }

    if (filters.contributorId) {
      query.andWhere('contributor.id = :contributorId', {
        contributorId: filters.contributorId,
      });
    }

    if (filters.search) {
      query.andWhere(
        '(LOWER(contributor.firstName) LIKE LOWER(:search) OR LOWER(contributor.lastName) LIKE LOWER(:search))',
        { search: `%${filters.search}%` }
      );
    }

    const transactions = await query
      .select([
        'contributor.id',
        'contributor.firstName',
        'contributor.lastName',
        'transaction.amount',
        'transaction.currency',
        'transaction.transactionDate',
      ])
      .orderBy('transaction.transactionDate', 'ASC')
      .getMany();

    // Get unique dates
    const dates = [...new Set(transactions.map(t => t.transactionDate))].sort();

    // Group by contributor
    const contributorsMap = new Map();

    transactions.forEach(transaction => {
      const contributorId = transaction.contributor?.id;
      if (!contributorId) return;

      if (!contributorsMap.has(contributorId)) {
        contributorsMap.set(contributorId, {
          userId: contributorId,
          firstName: transaction.contributor?.firstName || '',
          lastName: transaction.contributor?.lastName || '',
          totalAmount: 0,
          contributions: [],
        });
      }

      const contributor = contributorsMap.get(contributorId);
      contributor.totalAmount += transaction.amount;
      contributor.contributions.push({
        date: transaction.transactionDate,
        amount: transaction.amount,
        currency: transaction.currency,
      });
    });

    return {
      dates,
      contributors: Array.from(contributorsMap.values()),
      total: transactions.length
    };
  }

  private calculateMonthsBetweenDates(startDate: Date, endDate: Date): number {
    return (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      endDate.getMonth() - startDate.getMonth()
    );
  }
} 