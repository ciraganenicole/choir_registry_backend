import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './report.entity';
import { CreateReportDto } from './dto/report.dto';
import { UpdateReportDto } from './dto/report.dto';
import { ReportUser, ReportPermission } from './dto/report-permissions.dto';
import { User } from '../users/user.entity';
import { AdminUser } from '../admin/admin_users.entity';
import { UserCategory } from '../users/enums/user-category.enum';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  private async getUserInfo(userId: number | string): Promise<ReportUser> {
    console.log('getUserInfo called with userId:', userId);
    
    // First try to find as admin user (admin users have priority)
    const adminUserId = typeof userId === 'string' ? parseInt(userId) : userId;
    if (!isNaN(adminUserId)) {
      const adminUser = await this.adminUserRepository.findOneBy({ id: adminUserId });
      if (adminUser) {
        console.log('Found admin user:', adminUser);
        return {
          id: adminUser.id,
          type: 'admin',
          role: adminUser.role,
          username: adminUser.username,
          email: adminUser.email,
        };
      }
    }

    // If not found as admin, try as regular user
    if (typeof userId === 'number') {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (user) {
        console.log('Found regular user:', user);
        return {
          id: user.id,
          type: 'user',
          categories: user.categories,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        };
      }
    }

    throw new NotFoundException(`User with id ${userId} not found`);
  }

  private getReportPermissions(user: ReportUser): ReportPermission {
    // Admin users: Check by role
    if (user.type === 'admin') {
      switch (user.role) {
        case 'SUPER_ADMIN':
          return {
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            canViewAll: true,
            canManageOthers: true,
          };
        case 'ATTENDANCE_ADMIN':
        case 'FINANCE_ADMIN':
          // These admin roles can create and manage their own reports
          return {
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            canViewAll: true,
            canManageOthers: false, // Can only manage their own reports
          };
        default:
          // Unknown admin role - no permissions
          return {
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canViewAll: false,
            canManageOthers: false,
          };
      }
    }

    // Regular users: Check by category
    if (user.type === 'user') {
      if (user.categories?.includes(UserCategory.LEAD)) {
        return {
          canCreate: true,
          canUpdate: true,
          canDelete: false, // Only SUPER_ADMIN can delete
          canViewAll: true,
          canManageOthers: false, // Can only manage their own reports
        };
      }
      
      if (user.categories?.includes(UserCategory.COMMITTEE)) {
        return {
          canCreate: true,
          canUpdate: true,
          canDelete: false, // Only SUPER_ADMIN can delete
          canViewAll: true,
          canManageOthers: false, // Can only manage their own reports
        };
      }
      
      // All other regular users have no permissions
      return {
        canCreate: false,
        canUpdate: false,
        canDelete: false,
        canViewAll: false,
        canManageOthers: false,
      };
    }

    // Fallback: no permissions
    return {
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canViewAll: false,
      canManageOthers: false,
    };
  }

  private async canManageReport(reportId: number, user: ReportUser): Promise<boolean> {
    const permissions = this.getReportPermissions(user);
    
    if (permissions.canManageOthers) {
      return true; // SUPER_ADMIN can manage all reports
    }

    if (!permissions.canUpdate) {
      return false; // No update permissions
    }

    // Check if user owns the report
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      select: ['createdById']
    });

    return report ? report.createdById === user.id : false;
  }

  async create(createReportDto: CreateReportDto, userId: number): Promise<Report> {
    const user = await this.getUserInfo(userId);
    const permissions = this.getReportPermissions(user);

    if (!permissions.canCreate) {
      throw new ForbiddenException('You do not have permission to create reports. Only SUPER_ADMIN role, other admin roles, or users with LEAD/COMMITTEE category can create reports.');
    }
    const report = this.reportRepository.create({
      ...createReportDto,
      createdById: user.id,
    });
    
    const result = await this.reportRepository.save(report);
    return Array.isArray(result) ? result[0] : result;
  }

  async findAll(): Promise<Report[]> {
    return await this.reportRepository.find({
      relations: ['createdBy'],
      order: { meetingDate: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Report> {
    const report = await this.reportRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async update(id: number, updateReportDto: UpdateReportDto, userId: number): Promise<Report> {
    const user = await this.getUserInfo(userId);
    const canManage = await this.canManageReport(id, user);

    if (!canManage) {
      throw new ForbiddenException(`You can only update reports you created or have admin permissions. User: ${JSON.stringify(user)}, Report ID: ${id}`);
    }
    
    const report = await this.findOne(id);
    Object.assign(report, updateReportDto);
    
    return await this.reportRepository.save(report);
  }

  async remove(id: number, userId: number): Promise<void> {
    const user = await this.getUserInfo(userId);
    const canManage = await this.canManageReport(id, user);

    if (!canManage) {
      throw new ForbiddenException('You can only delete reports you created or have admin permissions');
    }
    
    const report = await this.findOne(id);
    await this.reportRepository.remove(report);
  }

  async getUserPermissions(userId: number): Promise<ReportPermission> {
    const user = await this.getUserInfo(userId);
    return this.getReportPermissions(user);
  }
}
