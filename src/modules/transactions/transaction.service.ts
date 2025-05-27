import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, Like } from 'typeorm';
import { Transaction, Currency } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { User } from '../users/user.entity';
import { TransactionType, isCategoryValidForType, SubCategories } from './enums/transactions-categories.enum';
import { DailyContributionFilterDto } from './dto/daily-contribution.dto';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

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
    
    // Format the date as YYYY-MM-DD string
    const formattedDate = typeof createTransactionDto.transactionDate === 'string' 
      ? createTransactionDto.transactionDate.split('T')[0]  // If it's already a string, just take the date part
      : new Date(createTransactionDto.transactionDate as Date).toISOString().split('T')[0];  // If it's a Date object, convert to YYYY-MM-DD
    
    // Copy basic fields
    Object.assign(transaction, {
      amount: createTransactionDto.amount,
      type: createTransactionDto.type,
      category: createTransactionDto.category,
      subcategory: createTransactionDto.subcategory,
      description: createTransactionDto.description,
      transactionDate: formattedDate,
      currency: createTransactionDto.currency || Currency.USD
    });

    // Handle external contributor
    if (createTransactionDto.externalContributorName) {
      transaction.externalContributorName = createTransactionDto.externalContributorName;
      transaction.externalContributorPhone = createTransactionDto.externalContributorPhone;
      transaction.contributorId = null;
      transaction.contributor = null;
    } 
    // Handle internal contributor
    else if (createTransactionDto.contributorId) {
      const user = await this.userRepository.findOne({
        where: { id: createTransactionDto.contributorId }
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${createTransactionDto.contributorId} not found`);
      }
      transaction.contributor = user;
      transaction.contributorId = user.id;
    }

    return this.transactionRepository.save(transaction);
  }

  async findAll(filterDto: TransactionFilterDto): Promise<{ data: Transaction[]; total: number }> {
    const { startDate, endDate, type, category, subcategory, contributorId, currency, search, page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contributor', 'contributor');

    if (startDate && endDate) {
      const startDateStr = typeof startDate === 'string' 
        ? startDate.split('T')[0]
        : new Date(startDate).toISOString().split('T')[0];
      const endDateStr = typeof endDate === 'string'
        ? endDate.split('T')[0]
        : new Date(endDate).toISOString().split('T')[0];

      queryBuilder.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      });
    }

    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }

    if (category) {
      if (type && !isCategoryValidForType(category, type)) {
        throw new BadRequestException('Invalid category for the specified transaction type');
      }
      queryBuilder.andWhere('transaction.category = :category', { category });
    }

    if (subcategory) {
      queryBuilder.andWhere('transaction.subcategory = :subcategory', { subcategory });
    }

    if (contributorId) {
      queryBuilder.andWhere('transaction.contributorId = :contributorId', { contributorId });
    }

    if (currency) {
      queryBuilder.andWhere('transaction.currency = :currency', { currency });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(contributor.firstName) LIKE LOWER(:search) OR LOWER(contributor.lastName) LIKE LOWER(:search) OR LOWER(transaction.externalContributorName) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy('transaction.transactionDate', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [transactions, total] = await queryBuilder.getManyAndCount();

    // Ensure amounts are numbers without changing the entity structure
    transactions.forEach(transaction => {
      transaction.amount = Number(transaction.amount) || 0;
    });

    return {
      data: transactions,
      total
    };
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['contributor']
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id);
    const { externalContributorName, contributorId, transactionDate, ...rest } = updateTransactionDto as CreateTransactionDto;

    // Format the date if provided
    let formattedDate = transaction.transactionDate;
    if (transactionDate) {
      formattedDate = typeof transactionDate === 'string'
        ? transactionDate.split('T')[0]  // If it's already a string, just take the date part
        : new Date(transactionDate as Date).toISOString().split('T')[0];  // If it's a Date object, convert to YYYY-MM-DD
    }

    // Handle contributor updates
    if (externalContributorName) {
      transaction.contributorId = null;
      transaction.contributor = null;
    } else if (contributorId) {
      const user = await this.userRepository.findOne({
        where: { id: contributorId }
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${contributorId} not found`);
      }
      transaction.contributor = user;
      transaction.contributorId = user.id;
    }

    Object.assign(transaction, {
      ...rest,
      transactionDate: formattedDate
    });
    return this.transactionRepository.save(transaction);
  }

  async remove(id: number): Promise<void> {
    const result = await this.transactionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
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

  async getStats(startDate?: Date | string, endDate?: Date | string) {
    // If no dates provided, default to current month
    const currentMonthStart = startOfMonth(new Date());
    const currentMonthEnd = endOfMonth(new Date());

    const startDateStr = startDate 
      ? (typeof startDate === 'string' 
        ? startDate.split('T')[0]
        : new Date(startDate).toISOString().split('T')[0])
      : currentMonthStart.toISOString().split('T')[0];
    const endDateStr = endDate
      ? (typeof endDate === 'string'
        ? endDate.split('T')[0]
        : new Date(endDate).toISOString().split('T')[0])
      : currentMonthEnd.toISOString().split('T')[0];

    console.log('Date Filter Debug:', {
      inputStartDate: startDate,
      inputEndDate: endDate,
      formattedStartDate: startDateStr,
      formattedEndDate: endDateStr,
      currentMonthStart: currentMonthStart.toISOString().split('T')[0],
      currentMonthEnd: currentMonthEnd.toISOString().split('T')[0]
    });

    const query = this.transactionRepository.createQueryBuilder('transaction');

    // Use >= for start date and <= for end date since we're working with a date column
    query.andWhere('transaction.transactionDate >= :startDate', { startDate: startDateStr })
         .andWhere('transaction.transactionDate <= :endDate', { endDate: endDateStr });

    const transactions = await query.getMany();

    console.log('Query Results:', {
      totalTransactions: transactions.length,
      dateRange: transactions.length > 0 ? {
        earliest: transactions[0].transactionDate,
        latest: transactions[transactions.length - 1].transactionDate
      } : 'No transactions found',
      transactions: transactions.map(t => ({
        date: t.transactionDate,
        amount: t.amount,
        currency: t.currency,
        type: t.type
      }))
    });

    // Calculate totals by currency
    const usdTransactions = transactions.filter(t => t.currency === Currency.USD);
    const fcTransactions = transactions.filter(t => t.currency === Currency.FC);

    console.log('Currency Filtering:', {
      usdTransactions: usdTransactions.map(t => ({ amount: t.amount, type: t.type })),
      fcTransactions: fcTransactions.map(t => ({ amount: t.amount, type: t.type }))
    });

    const usdTotal = usdTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const fcTotal = fcTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Calculate monthly breakdown
    const monthlyBreakdown = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.transactionDate).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          usd: 0,
          fc: 0
        };
      }
      if (transaction.currency === Currency.USD) {
        acc[month].usd += Number(transaction.amount);
      } else {
        acc[month].fc += Number(transaction.amount);
      }
      return acc;
    }, {} as Record<string, { usd: number; fc: number }>);

    // Calculate daily totals using the provided date range
    const dailyTotalUSD = usdTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const dailyTotalFC = fcTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    console.log('Stats Summary:', {
      usdTotal,
      fcTotal,
      monthlyBreakdown,
      monthlyBreakdownKeys: Object.keys(monthlyBreakdown),
      dailyTotalUSD,
      dailyTotalFC
    });

    return {
      totals: {
        usd: usdTotal,
        fc: fcTotal
      },
      monthlyBreakdown,
      dateRange: {
        from: new Date(startDateStr),
        to: new Date(endDateStr)
      },
      dailyTotalUSD,
      dailyTotalFC
    };
  }

  private getPeriods(startDate: Date, endDate: Date, groupBy: 'week' | 'month' | 'year'): string[] {
    const periods: string[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      periods.push(this.getPeriodKey(currentDate, groupBy));
      currentDate = this.addPeriod(currentDate, groupBy);
    }

    return periods;
  }

  private getPeriodKey(date: Date, groupBy: 'week' | 'month' | 'year'): string {
    switch (groupBy) {
      case 'week':
        return format(date, 'yyyy-[W]ww');
      case 'month':
        return format(date, 'yyyy-MM');
      case 'year':
        return format(date, 'yyyy');
      default:
        return format(date, 'yyyy-MM');
    }
  }

  private addPeriod(date: Date, groupBy: 'week' | 'month' | 'year'): Date {
    const newDate = new Date(date);
    switch (groupBy) {
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    return newDate;
  }

  async getTransactionStats(startDate: Date | string, endDate: Date | string, groupBy: 'week' | 'month' | 'year' = 'month') {
    const startDateStr = typeof startDate === 'string'
      ? startDate.split('T')[0]
      : new Date(startDate).toISOString().split('T')[0];
    const endDateStr = typeof endDate === 'string'
      ? endDate.split('T')[0]
      : new Date(endDate).toISOString().split('T')[0];

    const periods = this.getPeriods(new Date(startDateStr), new Date(endDateStr), groupBy);
    const stats = new Map<string, {
      period: string;
      income: { usd: number; fc: number };
      expenses: { usd: number; fc: number };
    }>();

    // Initialize stats for all periods
    periods.forEach(period => {
      stats.set(period, {
        period,
        income: { usd: 0, fc: 0 },
        expenses: { usd: 0, fc: 0 }
      });
    });

    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contributor', 'contributor')
      .where('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr
      });

    const transactions = await query.getMany();

    transactions.forEach(transaction => {
      const period = this.getPeriodKey(new Date(transaction.transactionDate), groupBy);
      const stat = stats.get(period);
      if (stat) {
        if (transaction.type === TransactionType.INCOME) {
          if (transaction.currency === Currency.USD) {
            stat.income.usd += Number(transaction.amount);
          } else {
            stat.income.fc += Number(transaction.amount);
          }
        } else {
          if (transaction.currency === Currency.USD) {
            stat.expenses.usd += Number(transaction.amount);
          } else {
            stat.expenses.fc += Number(transaction.amount);
          }
        }
      }
    });

    return Array.from(stats.values());
  }

  async getTransactionHistory(userId: number, startDate: Date | string, endDate: Date | string) {
    const startDateStr = typeof startDate === 'string'
      ? startDate.split('T')[0]
      : new Date(startDate).toISOString().split('T')[0];
    const endDateStr = typeof endDate === 'string'
      ? endDate.split('T')[0]
      : new Date(endDate).toISOString().split('T')[0];

    return this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.contributorId = :userId', { userId })
      .andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr
      })
      .orderBy('transaction.transactionDate', 'DESC')
      .getMany();
  }

  async getDailyContributions(filters: DailyContributionFilterDto) {
    try {
      const { startDate, endDate, contributorId, search, page = 1, limit = 10 } = filters;
      const skip = (page - 1) * limit;

      const query = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.contributor', 'contributor')
        .where('transaction.category = :category', { category: 'DAILY' })
        .andWhere('transaction.type = :type', { type: TransactionType.INCOME });

      if (startDate && endDate) {
        // Ensure we have proper Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD format.');
        }

        query.andWhere('transaction.transactionDate BETWEEN :start AND :end', {
          start,
          end,
        });
      }

      if (contributorId) {
        query.andWhere('contributor.id = :contributorId', {
          contributorId,
        });
      }

      if (search) {
        query.andWhere(
          '(LOWER(contributor.firstName) LIKE LOWER(:search) OR LOWER(contributor.lastName) LIKE LOWER(:search))',
          { search: `%${search}%` }
        );
      }

      // If limit is very large (e.g., 999999), we're exporting all records
      if (limit < 999999) {
        query.skip(skip).take(limit);
      }

      const transactions = await query
        .orderBy('transaction.transactionDate', 'ASC')
        .getMany();

      // Get unique dates
      const dates = [...new Set(transactions.map(t => {
        const date = new Date(t.transactionDate);
        return date.toISOString().split('T')[0];
      }))].sort();

      // Group by contributor
      const contributorsMap = new Map();

      transactions.forEach(transaction => {
        if (!transaction.contributor) return;

        const contributorId = transaction.contributor.id;
        if (!contributorsMap.has(contributorId)) {
          contributorsMap.set(contributorId, {
            userId: contributorId,
            firstName: transaction.contributor.firstName || '',
            lastName: transaction.contributor.lastName || '',
            totalAmount: 0,
            contributions: [],
          });
        }

        const contributor = contributorsMap.get(contributorId);
        const amount = Number(transaction.amount) || 0;
        contributor.totalAmount += amount;
        contributor.contributions.push({
          date: new Date(transaction.transactionDate).toISOString().split('T')[0],
          amount: amount,
          currency: transaction.currency
        });
      });

      // Sort contributors by name
      const contributors = Array.from(contributorsMap.values())
        .sort((a, b) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName));

      return {
        dates,
        contributors,
        total: transactions.length
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error in getDailyContributions:', error);
      throw new BadRequestException('Failed to fetch daily contributions. Please check your input parameters.');
    }
  }
} 