import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto, UpdateReportDto } from './dto/report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import { UserCategory } from '../users/enums/user-category.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Report } from './report.entity';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD, UserCategory.COMMITTEE)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async create(
    @Body() createReportDto: CreateReportDto,
    @CurrentUser() user: any,
  ): Promise<Report> {
    return await this.reportService.create(createReportDto, user.id);
  }

  @Get()
  async findAll(): Promise<Report[]> {
    return await this.reportService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Report> {
    return await this.reportService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReportDto: UpdateReportDto,
    @CurrentUser() user: any,
  ): Promise<Report> {
    return await this.reportService.update(id, updateReportDto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.reportService.remove(id, user.id);
    return { message: 'Report deleted successfully' };
  }

  @Get('permissions')
  async getMyPermissions(@CurrentUser() user: any): Promise<any> {
    return this.reportService.getUserPermissions(user.id);
  }
}
