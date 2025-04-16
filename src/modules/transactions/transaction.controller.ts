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
  DefaultValuePipe,
  Header,
  Delete,
  Put
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { DailyContributionFilterDto } from './dto/daily-contribution.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Get('stats')
  async getStats() {
    return this.transactionService.getStats();
  }

  @Get()
  async findAll(@Query() filterDto: TransactionFilterDto) {
    console.log('Received query params:', filterDto);
    try {
      const result = await this.transactionService.findAll(filterDto);
      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  @Get('daily')
  async getDailyContributions(@Query() filterDto: DailyContributionFilterDto) {
    return this.transactionService.getDailyContributions(filterDto);
  }

  @Get('report')
  async generateReport(@Query() filterDto: TransactionFilterDto) {
    return this.transactionService.generateReport(filterDto);
  }

  @Get('history/:userId')
  async getTransactionHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date
  ) {
    return this.transactionService.getTransactionHistory(userId, startDate, endDate);
  }

  @Get('stats/detailed')
  async getTransactionStats(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Query('groupBy') groupBy: 'week' | 'month' | 'year'
  ) {
    return this.transactionService.getTransactionStats(startDate, endDate, groupBy);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto
  ) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.remove(id);
  }

  @Get('user/:userId/contributions')
  async getUserContributions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() filterDto: TransactionFilterDto
  ) {
    return this.transactionService.getUserContributions(userId, filterDto);
  }
} 