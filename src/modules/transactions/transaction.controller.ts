import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { DailyContributionFilterDto } from './dto/daily-contribution.dto';
import { TransactionHistoryQueryDto } from './dto/transaction-history-query.dto';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import {
  MAX_DAILY_DATE_RANGE_DAYS,
  MAX_EXPORT_ROWS,
  MAX_PAGE_SIZE,
} from './dto/pagination-meta.dto';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Create transaction' })
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Get()
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List transactions (ledger)',
    description:
      `Pagination applies after all filters. \`total\` and \`meta.total\` count matching transaction rows. Dates must be both provided to filter by range (inclusive calendar dates as YYYY-MM-DD). \`limit\` is capped at ${MAX_PAGE_SIZE}; \`exportAll=true\` returns up to ${MAX_EXPORT_ROWS} rows with \`meta.truncated\` if more exist.`,
  })
  async findAll(@Query() filterDto: TransactionFilterDto) {
    return this.transactionService.findAll(filterDto);
  }

  @Get('stats')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Transaction aggregates (no pagination)',
    description:
      'Income/expense totals and monthly breakdown for optionally bounded dates (each bound inclusive when set). When omitted, stats cover all rows in the database. Not paginated; totals always reflect the full filtered aggregate.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description:
      'Start date for filtering (YYYY-MM-DD). If not provided, includes all transactions from the beginning.',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (YYYY-MM-DD). If not provided, includes all transactions until the end.',
    type: String,
  })
  async getStats(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.transactionService.getStats(startDate, endDate);
  }

  @Get('stats/detailed')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Stats by period (aggregate)',
    description:
      'Buckets transactions into weeks/months/years within [startDate, endDate] inclusive. All periods in that calendar span are represented; not paginated.',
  })
  async getTransactionStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy: 'week' | 'month' | 'year',
  ) {
    return this.transactionService.getTransactionStats(startDate, endDate, groupBy);
  }

  @Get('daily')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Daily contributions matrix',
    description:
      `\`dates\` lists every calendar day in the requested range (or derived min–max when dates omitted). Pagination applies to contributor rows only; each row includes all contribution lines in range for that member. \`total\` and \`meta.total\` count contributors matching filters, not transactions. Daily rows without an internal member (external contributor) are excluded from the matrix. With both dates set, inclusive span cannot exceed ${MAX_DAILY_DATE_RANGE_DAYS} days (longest Jan 1–Dec 31 leap-year span). \`exportAll=true\` loads the full matrix but rejects if more than ${MAX_EXPORT_ROWS} transaction rows would be returned.`,
  })
  async getDailyContributions(@Query() filterDto: DailyContributionFilterDto) {
    return this.transactionService.getDailyContributions(filterDto);
  }

  @Get('report')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Category/type summary report',
    description:
      'Aggregates amounts by category and type for the filter; no pagination. `total` is the grand sum for the filtered set.',
  })
  async generateReport(@Query() filterDto: TransactionFilterDto) {
    return this.transactionService.generateReport(filterDto);
  }

  @Get('history/:userId')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'User transaction ledger',
    description:
      `Paginated slice of one member’s transactions in [startDate, endDate] inclusive (calendar dates). \`total\` / \`meta\` count filtered rows. Same caps as GET /transactions (\`limit\` ≤ ${MAX_PAGE_SIZE}, \`exportAll\` up to ${MAX_EXPORT_ROWS} rows).`,
  })
  async getTransactionHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query(new ValidationPipe({ transform: true })) query: TransactionHistoryQueryDto,
  ) {
    return this.transactionService.getTransactionHistory(userId, query);
  }

  @Get('user/:userId/contributions')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'User contribution totals by category',
    description:
      'Income-only aggregates per category for the user; no pagination. `total` is the sum for the filtered period.',
  })
  async getUserContributions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() filterDto: TransactionFilterDto,
  ) {
    return this.transactionService.getUserContributions(userId, filterDto);
  }

  @Get(':id')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get transaction by id' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.findOne(id);
  }

  @Put(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: 'Update transaction' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete transaction' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.remove(id);
  }
}
