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
  UseGuards,
  DefaultValuePipe,
  Header
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto, TransactionFilterDto } from '../../common/dtos/transaction.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { Transaction } from './transaction.entity';
import { TransactionFilters } from './dto/transaction-filters.dto';
import { DailyContributionFilterDto } from './dto/daily-contribution.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    return this.transactionService.create(createTransactionDto);
  }

  @Get('stats')
  async getStats() {
    return this.transactionService.getStats();
  }

  @Get()
  async findAll(@Query() query: any) {
    const { page = 1, limit = 10, ...filters } = query;
    return this.transactionService.findAll(filters, { page, limit });
  }

  @Get('reports')
  async generateReport(
    @Query(new ValidationPipe({ transform: true })) filters: TransactionFilterDto
  ) {
    return this.transactionService.generateReport(filters);
  }

  @Get('user/:userId/contributions')
  async getUserContributions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query(new ValidationPipe({ transform: true })) filters: TransactionFilterDto
  ) {
    return this.transactionService.getUserContributions(userId, filters);
  }

  @Get('daily')
  async getDailyContributions(@Query() filters: DailyContributionFilterDto) {
    return this.transactionService.getDailyContributions(filters);
  }
} 