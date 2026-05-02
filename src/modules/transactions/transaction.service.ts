import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Transaction, Currency } from './transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { User } from '../users/user.entity';
import {
  TransactionType,
  isCategoryValidForType,
  SubCategories,
  IncomeCategories,
} from './enums/transactions-categories.enum';
import { DailyContributionFilterDto } from './dto/daily-contribution.dto';
import { TransactionHistoryQueryDto } from './dto/transaction-history-query.dto';
import { eachDayOfInterval, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import {
  PaginationMetaDto,
  MAX_DAILY_DATE_RANGE_DAYS,
  MAX_EXPORT_ROWS,
  buildPaginationMeta,
  resolvePagination,
} from './dto/pagination-meta.dto';

@Injectable()
export class TransactionService {
  /** Scalar user columns for contributor relation (no password / fingerprintData loaded from DB). */
  private static readonly CONTRIBUTOR_SELECT: (keyof User)[] = [
    'id',
    'firstName',
    'lastName',
    'email',
    'matricule',
    'phoneNumber',
    'whatsappNumber',
    'phone',
    'categories',
    'commissions',
    'gender',
    'maritalStatus',
    'educationLevel',
    'profession',
    'competenceDomain',
    'churchOfOrigin',
    'commune',
    'quarter',
    'reference',
    'address',
    'joinDate',
    'isActive',
    'profileImageUrl',
    'voiceCategory',
    'createdAt',
    'updatedAt',
  ];

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private async loadContributorPublic(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [...TransactionService.CONTRIBUTOR_SELECT],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = new Transaction();
    
    // Format the date as YYYY-MM-DD string (extract date part from ISO string)
    const formattedDate = createTransactionDto.transactionDate.split('T')[0];
    
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
      const user = await this.loadContributorPublic(createTransactionDto.contributorId);
      transaction.contributor = user;
      transaction.contributorId = user.id;
    }

    return this.transactionRepository.save(transaction);
  }

  private applyTransactionListFilters(
    qb: SelectQueryBuilder<Transaction>,
    filterDto: TransactionFilterDto,
  ): void {
    const { startDate, endDate, type, category, subcategory, contributorId, currency, search } =
      filterDto;

    if (startDate && endDate) {
      const startDateStr = startDate.split('T')[0];
      const endDateStr = endDate.split('T')[0];

      qb.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      });
    }

    if (type) {
      qb.andWhere('transaction.type = :type', { type });
    }

    if (category) {
      if (type && !isCategoryValidForType(category, type)) {
        throw new BadRequestException('Invalid category for the specified transaction type');
      }
      qb.andWhere('transaction.category = :category', { category });
    }

    if (subcategory) {
      qb.andWhere('transaction.subcategory = :subcategory', { subcategory });
    }

    if (contributorId) {
      qb.andWhere('transaction.contributorId = :contributorId', { contributorId });
    }

    if (currency) {
      qb.andWhere('transaction.currency = :currency', { currency });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(contributor.firstName) LIKE LOWER(:search) OR LOWER(contributor.lastName) LIKE LOWER(:search) OR LOWER(transaction.externalContributorName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }
  }

  /**
   * Paginated transaction list. Sorting and slicing happen in SQL (LIMIT/OFFSET), not in memory.
   * Use `meta` for UI paging; `total` is duplicated at the root for older clients.
   */
  async findAll(
    filterDto: TransactionFilterDto,
  ): Promise<{ data: Transaction[]; total: number; meta: PaginationMetaDto }> {
    const pagination = resolvePagination({
      page: filterDto.page,
      limit: filterDto.limit,
      exportAll: filterDto.exportAll,
    });

    const countQb = this.transactionRepository.createQueryBuilder('transaction');
    if (filterDto.search) {
      countQb.leftJoin('transaction.contributor', 'contributor');
    }
    this.applyTransactionListFilters(countQb, filterDto);
    const countRow = await countQb
      .select('COUNT(DISTINCT transaction.id)', 'cnt')
      .getRawOne();
    const total = Number(countRow?.cnt ?? 0);

    const dataQb = this.transactionRepository.createQueryBuilder('transaction');
    dataQb.leftJoinAndSelect('transaction.contributor', 'contributor');
    this.applyTransactionListFilters(dataQb, filterDto);
    dataQb
      .orderBy('transaction.transactionDate', 'DESC')
      .addOrderBy('transaction.createdAt', 'DESC');

    if (pagination.mode === 'export') {
      dataQb.take(pagination.take!);
    } else {
      dataQb.skip(pagination.offset).take(pagination.take!);
    }

    const transactions = await dataQb.getMany();

    transactions.forEach((transaction) => {
      transaction.amount = Number(transaction.amount) || 0;
    });

    const meta =
      pagination.mode === 'export'
        ? ({
            page: 1,
            limit: transactions.length,
            total,
            totalPages: 1,
            hasNextPage: total > transactions.length,
            hasPreviousPage: false,
            truncated: total > transactions.length,
          } satisfies PaginationMetaDto)
        : buildPaginationMeta(total, pagination.page, pagination.limit);

    return {
      data: transactions,
      total,
      meta,
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

    // Format the date if provided (extract date part from ISO string)
    let formattedDate = transaction.transactionDate;
    if (transactionDate) {
      formattedDate = transactionDate.split('T')[0];
    }

    // Handle contributor updates
    if (externalContributorName) {
      transaction.contributorId = null;
      transaction.contributor = null;
    } else if (contributorId) {
      const user = await this.loadContributorPublic(contributorId);
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

  private buildReportBaseQuery(filters: TransactionFilterDto): SelectQueryBuilder<Transaction> {
    const query = this.transactionRepository.createQueryBuilder('transaction');

    if (filters.startDate && filters.endDate) {
      query.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
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
        contributorId: filters.contributorId,
      });
    }

    return query;
  }

  async generateReport(filters: TransactionFilterDto): Promise<any> {
    const base = this.buildReportBaseQuery(filters);

    const summary = await base
      .clone()
      .select('transaction.category', 'category')
      .addSelect('transaction.type', 'type')
      .addSelect('SUM("transaction"."amount"::numeric)', 'total')
      .addSelect('COUNT(*)', 'count')
      .groupBy('transaction.category')
      .addGroupBy('transaction.type')
      .getRawMany();

    const totalRow = await base
      .clone()
      .select('COALESCE(SUM("transaction"."amount"::numeric), 0)', 'total')
      .getRawOne();

    return {
      summary,
      total: Number(totalRow?.total ?? 0),
      filters,
    };
  }

  private buildUserContributionsBaseQuery(
    userId: number,
    filters: TransactionFilterDto,
  ): SelectQueryBuilder<Transaction> {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.contributorId = :userId', { userId })
      .andWhere('transaction.type = :type', { type: TransactionType.INCOME });

    if (filters.startDate && filters.endDate) {
      const startDateStr = filters.startDate.split('T')[0];
      const endDateStr = filters.endDate.split('T')[0];

      query.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      });
    }

    if (filters.category) {
      if (!isCategoryValidForType(filters.category, TransactionType.INCOME)) {
        throw new BadRequestException('Invalid category for income transactions');
      }
      query.andWhere('transaction.category = :category', { category: filters.category });
    }

    return query;
  }

  async getUserContributions(
    userId: number,
    filters: TransactionFilterDto,
  ): Promise<any> {
    const base = this.buildUserContributionsBaseQuery(userId, filters);

    const contributions = await base
      .clone()
      .select('transaction.category', 'category')
      .addSelect('SUM("transaction"."amount"::numeric)', 'total')
      .addSelect('COUNT(*)', 'count')
      .groupBy('transaction.category')
      .getRawMany();

    const totalRow = await base
      .clone()
      .select('COALESCE(SUM("transaction"."amount"::numeric), 0)', 'total')
      .getRawOne();

    return {
      contributions,
      total: Number(totalRow?.total ?? 0),
      filters,
    };
  }

  private buildStatsBaseQuery(
    startDate?: string,
    endDate?: string,
    filterDto?: TransactionFilterDto,
  ): SelectQueryBuilder<Transaction> {
    const qb = this.transactionRepository.createQueryBuilder('transaction');

    if (startDate || endDate) {
      const startDateStr = startDate ? startDate.split('T')[0] : undefined;
      const endDateStr = endDate ? endDate.split('T')[0] : undefined;

      if (startDateStr) {
        qb.andWhere('transaction.transactionDate >= :startDate', { startDate: startDateStr });
      }
      if (endDateStr) {
        qb.andWhere('transaction.transactionDate <= :endDate', { endDate: endDateStr });
      }
    }

    if (filterDto) {
      if (filterDto.type) {
        qb.andWhere('transaction.type = :type', { type: filterDto.type });
      }
      if (filterDto.category) {
        qb.andWhere('transaction.category = :category', { category: filterDto.category });
      }
      if (filterDto.subcategory) {
        qb.andWhere('transaction.subcategory = :subcategory', { subcategory: filterDto.subcategory });
      }
      if (filterDto.contributorId) {
        qb.andWhere('transaction.contributorId = :contributorId', {
          contributorId: filterDto.contributorId,
        });
      }
      if (filterDto.currency) {
        qb.andWhere('transaction.currency = :currency', { currency: filterDto.currency });
      }
      if (filterDto.search) {
        qb.leftJoin('transaction.contributor', 'contributor');
        qb.andWhere(
          '(LOWER(contributor.firstName) LIKE LOWER(:search) OR LOWER(contributor.lastName) LIKE LOWER(:search) OR LOWER(transaction.externalContributorName) LIKE LOWER(:search))',
          { search: `%${filterDto.search}%` },
        );
      }
    }

    return qb;
  }

  async getStats(startDate?: string, endDate?: string, filterDto?: TransactionFilterDto) {
    const base = this.buildStatsBaseQuery(startDate, endDate, filterDto);
    const ti = TransactionType.INCOME;
    const te = TransactionType.EXPENSE;
    const usd = Currency.USD;
    const fc = Currency.FC;

    const totalsRow = await base
      .clone()
      .select(
        `COALESCE(SUM(CASE WHEN "transaction"."type" = '${ti}' AND "transaction"."currency" = '${usd}' THEN "transaction"."amount"::numeric ELSE 0 END), 0)`,
        'income_usd',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN "transaction"."type" = '${ti}' AND "transaction"."currency" = '${fc}' THEN "transaction"."amount"::numeric ELSE 0 END), 0)`,
        'income_fc',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN "transaction"."type" = '${te}' AND "transaction"."currency" = '${usd}' THEN "transaction"."amount"::numeric ELSE 0 END), 0)`,
        'expense_usd',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN "transaction"."type" = '${te}' AND "transaction"."currency" = '${fc}' THEN "transaction"."amount"::numeric ELSE 0 END), 0)`,
        'expense_fc',
      )
      .getRawOne();

    const totalIncome = {
      usd: Number(totalsRow?.income_usd ?? 0),
      fc: Number(totalsRow?.income_fc ?? 0),
    };
    const totalExpense = {
      usd: Number(totalsRow?.expense_usd ?? 0),
      fc: Number(totalsRow?.expense_fc ?? 0),
    };
    const solde = {
      usd: totalIncome.usd - totalExpense.usd,
      fc: totalIncome.fc - totalExpense.fc,
    };

    const monthlyRows = await base
      .clone()
      .select(`TO_CHAR("transaction"."transactionDate"::date, 'YYYY-MM')`, 'month')
      .addSelect('transaction.type', 'type')
      .addSelect('transaction.currency', 'currency')
      .addSelect('SUM("transaction"."amount"::numeric)', 'sum')
      .groupBy(`TO_CHAR("transaction"."transactionDate"::date, 'YYYY-MM')`)
      .addGroupBy('transaction.type')
      .addGroupBy('transaction.currency')
      .orderBy(`TO_CHAR("transaction"."transactionDate"::date, 'YYYY-MM')`, 'ASC')
      .getRawMany();

    const monthlyBreakdown: Record<
      string,
      {
        income: { usd: number; fc: number };
        expense: { usd: number; fc: number };
        solde: { usd: number; fc: number };
      }
    > = {};

    for (const row of monthlyRows) {
      const month = String(row.month);
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = {
          income: { usd: 0, fc: 0 },
          expense: { usd: 0, fc: 0 },
          solde: { usd: 0, fc: 0 },
        };
      }
      const amount = Number(row.sum);
      const m = monthlyBreakdown[month];
      const rowType = row.type ?? row.transaction_type;
      const rowCurrency = row.currency ?? row.transaction_currency;
      if (rowType === TransactionType.INCOME) {
        if (rowCurrency === Currency.USD) m.income.usd += amount;
        else if (rowCurrency === Currency.FC) m.income.fc += amount;
      } else {
        if (rowCurrency === Currency.USD) m.expense.usd += amount;
        else if (rowCurrency === Currency.FC) m.expense.fc += amount;
      }
      m.solde.usd = m.income.usd - m.expense.usd;
      m.solde.fc = m.income.fc - m.expense.fc;
    }

    const dailyRow = await base
      .clone()
      .andWhere('transaction.category = :dailyCat', { dailyCat: IncomeCategories.DAILY })
      .select(
        `COALESCE(SUM(CASE WHEN "transaction"."currency" = '${usd}' THEN "transaction"."amount"::numeric ELSE 0 END), 0)`,
        'daily_usd',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN "transaction"."currency" = '${fc}' THEN "transaction"."amount"::numeric ELSE 0 END), 0)`,
        'daily_fc',
      )
      .getRawOne();

    const dailyTotalUSD = Number(dailyRow?.daily_usd ?? 0);
    const dailyTotalFC = Number(dailyRow?.daily_fc ?? 0);

    let dateRange: { from: Date | null; to: Date | null };
    if (startDate || endDate) {
      const startDateStr = startDate ? startDate.split('T')[0] : undefined;
      const endDateStr = endDate ? endDate.split('T')[0] : undefined;
      dateRange = {
        from: startDateStr ? new Date(startDateStr) : null,
        to: endDateStr ? new Date(endDateStr) : null,
      };
    } else {
      const rangeRow = await base
        .clone()
        .select('MIN("transaction"."transactionDate")', 'min')
        .addSelect('MAX("transaction"."transactionDate")', 'max')
        .getRawOne();
      dateRange = {
        from: rangeRow?.min ? new Date(String(rangeRow.min)) : null,
        to: rangeRow?.max ? new Date(String(rangeRow.max)) : null,
      };
    }

    return {
      totals: {
        income: totalIncome,
        expense: totalExpense,
        solde,
      },
      monthlyBreakdown,
      dateRange,
      dailyTotalUSD,
      dailyTotalFC,
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

  async getTransactionStats(startDate: string, endDate: string, groupBy: 'week' | 'month' | 'year' = 'month') {
    // Extract date part from ISO strings
    const startDateStr = startDate.split('T')[0];
    const endDateStr = endDate.split('T')[0];

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

    const rows = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('transaction.transactionDate', 'transactionDate')
      .addSelect('transaction.type', 'type')
      .addSelect('transaction.currency', 'currency')
      .addSelect('transaction.amount', 'amount')
      .where('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      })
      .getRawMany();

    for (const row of rows) {
      const transactionDate = row.transactionDate ?? row.transaction_transactionDate;
      const period = this.getPeriodKey(new Date(transactionDate as string), groupBy);
      const stat = stats.get(period);
      if (!stat) {
        continue;
      }
      const amount = Number(row.amount ?? row.transaction_amount);
      const type = row.type ?? row.transaction_type;
      const currency = row.currency ?? row.transaction_currency;
      if (type === TransactionType.INCOME) {
        if (currency === Currency.USD) {
          stat.income.usd += amount;
        } else {
          stat.income.fc += amount;
        }
      } else {
        if (currency === Currency.USD) {
          stat.expenses.usd += amount;
        } else {
          stat.expenses.fc += amount;
        }
      }
    }

    return Array.from(stats.values());
  }

  /**
   * Paginated ledger for one contributor. `total` / `meta` count filtered transaction rows.
   */
  async getTransactionHistory(
    userId: number,
    query: TransactionHistoryQueryDto,
  ): Promise<{ data: Transaction[]; total: number; meta: PaginationMetaDto }> {
    const startDateStr = query.startDate.split('T')[0];
    const endDateStr = query.endDate.split('T')[0];

    const pagination = resolvePagination({
      page: query.page,
      limit: query.limit,
      exportAll: query.exportAll,
    });

    const countQb = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.contributorId = :userId', { userId })
      .andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      });

    const countRow = await countQb.select('COUNT(transaction.id)', 'cnt').getRawOne();
    const total = Number(countRow?.cnt ?? 0);

    const dataQb = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contributor', 'contributor')
      .where('transaction.contributorId = :userId', { userId })
      .andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      })
      .orderBy('transaction.transactionDate', 'DESC')
      .addOrderBy('transaction.id', 'DESC');

    if (pagination.mode === 'export') {
      dataQb.take(pagination.take!);
    } else {
      dataQb.skip(pagination.offset).take(pagination.take!);
    }

    const transactions = await dataQb.getMany();

    transactions.forEach((t) => {
      t.amount = Number(t.amount) || 0;
    });

    const meta =
      pagination.mode === 'export'
        ? ({
            page: 1,
            limit: transactions.length,
            total,
            totalPages: 1,
            hasNextPage: total > transactions.length,
            hasPreviousPage: false,
            truncated: total > transactions.length,
          } satisfies PaginationMetaDto)
        : buildPaginationMeta(total, pagination.page, pagination.limit);

    return { data: transactions, total, meta };
  }

  /**
   * @param contributorJoin `false` when `contributor` is already joined on the query builder.
   */
  private applyDailyContributionsFilters(
    qb: SelectQueryBuilder<Transaction>,
    filters: DailyContributionFilterDto,
    options?: { contributorJoin?: 'left' | 'inner' | false },
  ): void {
    const join = options?.contributorJoin;

    if (join !== false) {
      if (join === 'inner') {
        qb.innerJoin('transaction.contributor', 'contributor');
      } else {
        qb.leftJoin('transaction.contributor', 'contributor');
      }
    }

    const { startDate, endDate, contributorId, search } = filters;

    qb.where('transaction.category = :category', { category: 'DAILY' }).andWhere(
      'transaction.type = :type',
      { type: TransactionType.INCOME },
    );

    if (startDate && endDate) {
      const startDateStr = startDate.split('T')[0];
      const endDateStr = endDate.split('T')[0];
      qb.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      });
    }

    if (contributorId) {
      qb.andWhere('transaction.contributorId = :contributorId', { contributorId });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(contributor.firstName) LIKE LOWER(:search) OR LOWER(contributor.lastName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }
  }

  /**
   * Daily category income rows without an internal contributor are excluded from the matrix
   * (only members with contributorId appear as rows). Documented in API.
   */
  private assertDailyDateRangeWithinLimit(startDate?: string, endDate?: string): void {
    if (!startDate || !endDate) {
      return;
    }
    const startStr = startDate.split('T')[0];
    const endStr = endDate.split('T')[0];
    const start = parseISO(startStr);
    const end = parseISO(endStr);
    if (start > end) {
      throw new BadRequestException('startDate must be on or before endDate');
    }
    const days = differenceInCalendarDays(end, start) + 1;
    if (days > MAX_DAILY_DATE_RANGE_DAYS) {
      throw new BadRequestException(
        `Date range cannot exceed ${MAX_DAILY_DATE_RANGE_DAYS} days (inclusive). Narrow the range or split your request.`,
      );
    }
  }

  private async resolveDailyMatrixDates(filters: DailyContributionFilterDto): Promise<string[]> {
    if (filters.startDate && filters.endDate) {
      const startStr = filters.startDate.split('T')[0];
      const endStr = filters.endDate.split('T')[0];
      return eachDayOfInterval({
        start: parseISO(startStr),
        end: parseISO(endStr),
      }).map((d) => format(d, 'yyyy-MM-dd'));
    }

    const qb = this.transactionRepository.createQueryBuilder('transaction');
    this.applyDailyContributionsFilters(qb, filters, { contributorJoin: 'left' });
    const row = await qb
      .select('MIN(transaction.transactionDate)', 'min')
      .addSelect('MAX(transaction.transactionDate)', 'max')
      .getRawOne();
    const min = row?.min;
    const max = row?.max;
    if (min == null || max == null) {
      return [];
    }
    const minS = String(min).split('T')[0];
    const maxS = String(max).split('T')[0];
    return eachDayOfInterval({
      start: parseISO(minS),
      end: parseISO(maxS),
    }).map((d) => format(d, 'yyyy-MM-dd'));
  }

  private async fetchDistinctContributorIdsForDailyPage(
    filters: DailyContributionFilterDto,
    pagination: { offset: number; take: number } | null,
  ): Promise<number[]> {
    const qb = this.transactionRepository.createQueryBuilder('transaction');
    this.applyDailyContributionsFilters(qb, filters, { contributorJoin: 'inner' });

    qb
      .select('contributor.id', 'id')
      .groupBy('contributor.id')
      .addGroupBy('contributor.firstName')
      .addGroupBy('contributor.lastName')
      .orderBy('contributor.firstName', 'ASC')
      .addOrderBy('contributor.lastName', 'ASC');

    if (pagination) {
      qb.offset(pagination.offset).limit(pagination.take);
    }

    const rows = await qb.getRawMany();
    return rows.map((r) => Number(r.id));
  }

  private async fetchDailyTransactionsForContributors(
    filters: DailyContributionFilterDto,
    contributorIds: number[],
  ): Promise<Transaction[]> {
    if (contributorIds.length === 0) {
      return [];
    }

    const qb = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.contributor', 'contributor')
      .where('transaction.contributorId IN (:...contributorIds)', { contributorIds });

    this.applyDailyContributionsFilters(qb, filters, { contributorJoin: false });

    return qb.orderBy('transaction.transactionDate', 'ASC').addOrderBy('transaction.id', 'ASC').getMany();
  }

  /**
   * Matrix response: `dates` covers the full filtered calendar interval; pagination applies to
   * contributor rows only (`meta.total` = contributors matching the filter, not transaction rows).
   */
  async getDailyContributions(filters: DailyContributionFilterDto) {
    try {
      this.assertDailyDateRangeWithinLimit(filters.startDate, filters.endDate);

      const fullExport = Boolean(filters.exportAll);
      const pagination = fullExport
        ? null
        : resolvePagination({ page: filters.page, limit: filters.limit });

      const dates = await this.resolveDailyMatrixDates(filters);

      const countContributorsQb = this.transactionRepository.createQueryBuilder('transaction');
      this.applyDailyContributionsFilters(countContributorsQb, filters, { contributorJoin: 'inner' });

      const contributorCountRow = await countContributorsQb
        .select('COUNT(DISTINCT contributor.id)', 'cnt')
        .getRawOne();
      const totalContributors = Number(contributorCountRow?.cnt ?? 0);

      if (fullExport) {
        const txCountQb = this.transactionRepository.createQueryBuilder('transaction');
        this.applyDailyContributionsFilters(txCountQb, filters, { contributorJoin: 'left' });
        const txCountRow = await txCountQb.select('COUNT(transaction.id)', 'cnt').getRawOne();
        const totalTransactions = Number(txCountRow?.cnt ?? 0);
        if (totalTransactions > MAX_EXPORT_ROWS) {
          throw new BadRequestException(
            `Too many transaction rows (${totalTransactions}) for export. Maximum is ${MAX_EXPORT_ROWS}. Narrow the date range or use paginated requests without exportAll.`,
          );
        }
      }

      const contributorIds = await this.fetchDistinctContributorIdsForDailyPage(
        filters,
        fullExport || !pagination
          ? null
          : { offset: pagination.offset, take: pagination.take ?? pagination.limit },
      );

      const transactions = await this.fetchDailyTransactionsForContributors(filters, contributorIds);

      const contributorsMap = new Map<
        number,
        {
          userId: number;
          firstName: string;
          lastName: string;
          totalAmount: number;
          contributions: Array<{ date: string; amount: number; currency: Currency }>;
        }
      >();

      for (const transaction of transactions) {
        if (!transaction.contributor) {
          continue;
        }

        const cid = transaction.contributor.id;
        if (!contributorsMap.has(cid)) {
          contributorsMap.set(cid, {
            userId: cid,
            firstName: transaction.contributor.firstName || '',
            lastName: transaction.contributor.lastName || '',
            totalAmount: 0,
            contributions: [],
          });
        }

        const row = contributorsMap.get(cid)!;
        const amount = Number(transaction.amount) || 0;
        row.totalAmount += amount;
        const dateStr =
          typeof transaction.transactionDate === 'string'
            ? transaction.transactionDate.split('T')[0]
            : format(new Date(transaction.transactionDate), 'yyyy-MM-dd');
        row.contributions.push({
          date: dateStr,
          amount,
          currency: transaction.currency,
        });
      }

      const contributors = Array.from(contributorsMap.values()).sort((a, b) =>
        (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName),
      );

      const meta: PaginationMetaDto = fullExport
        ? {
            page: 1,
            limit: contributors.length,
            total: totalContributors,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            truncated: false,
          }
        : buildPaginationMeta(totalContributors, pagination!.page, pagination!.limit);

      return {
        dates,
        contributors,
        /** Number of contributors matching the filter (same as meta.total). */
        total: totalContributors,
        meta,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch daily contributions. Please check your input parameters.');
    }
  }
}