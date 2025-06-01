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
  Put,
  UseGuards
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { DailyContributionFilterDto } from './dto/daily-contribution.dto';
import { ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Get()
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  async findAll(@Query() filterDto: TransactionFilterDto) {
    try {
      const result = await this.transactionService.findAll(filterDto);
      return result;
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  @Get('stats')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get transaction statistics with optional date filtering' })
  @ApiQuery({ 
      name: 'startDate', 
      required: false, 
      description: 'Start date for filtering (YYYY-MM-DD)',
      type: String 
  })
  @ApiQuery({ 
      name: 'endDate', 
      required: false, 
      description: 'End date for filtering (YYYY-MM-DD)',
      type: String 
  })
  async getStats(
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string
  ) {
      return this.transactionService.getStats(
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
      );
  }

  @Get('stats/detailed')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  async getTransactionStats(
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date,
    @Query('groupBy') groupBy: 'week' | 'month' | 'year'
  ) {
    return this.transactionService.getTransactionStats(startDate, endDate, groupBy);
  }

  @Get('daily')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  async getDailyContributions(@Query() filterDto: DailyContributionFilterDto) {
    return this.transactionService.getDailyContributions(filterDto);
  }

  @Get('report')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  async generateReport(@Query() filterDto: TransactionFilterDto) {
    return this.transactionService.generateReport(filterDto);
  }

  @Get('history/:userId')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  async getTransactionHistory(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('startDate') startDate: Date,
    @Query('endDate') endDate: Date
  ) {
    return this.transactionService.getTransactionHistory(userId, startDate, endDate);
  }

  @Get('user/:userId/contributions')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  async getUserContributions(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() filterDto: TransactionFilterDto
  ) {
    return this.transactionService.getUserContributions(userId, filterDto);
  }

  @Get(':id')
  @Roles(AdminRole.FINANCE_ADMIN, AdminRole.SUPER_ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.findOne(id);
  }

  @Put(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto
  ) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @Roles(AdminRole.SUPER_ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionService.remove(id);
  }
} 