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
import { CommuniqueService } from './communique.service';
import { CreateCommuniqueDto, UpdateCommuniqueDto } from './dto/communique.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import { UserCategory } from '../users/enums/user-category.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Communique } from './communique.entity';

@Controller('communiques')
export class CommuniqueController {
  constructor(private readonly communiqueService: CommuniqueService) {}

  // Public endpoints (no authentication required)
  @Get()
  async findAll(): Promise<Communique[]> {
    return await this.communiqueService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Communique> {
    return await this.communiqueService.findOne(id);
  }

  // Admin endpoints (authentication required)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD, UserCategory.COMMITTEE)
  async create(
    @Body() createCommuniqueDto: CreateCommuniqueDto,
    @CurrentUser() user: any,
  ): Promise<Communique> {
    return await this.communiqueService.create(createCommuniqueDto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD, UserCategory.COMMITTEE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommuniqueDto: UpdateCommuniqueDto,
    @CurrentUser() user: any,
  ): Promise<Communique> {
    return await this.communiqueService.update(id, updateCommuniqueDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ATTENDANCE_ADMIN, AdminRole.FINANCE_ADMIN, UserCategory.LEAD, UserCategory.COMMITTEE)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.communiqueService.remove(id, user.id);
    return { message: 'Communique deleted successfully' };
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  async getMyPermissions(@CurrentUser() user: any): Promise<any> {
    return this.communiqueService.getUserPermissions(user.id);
  }
}
