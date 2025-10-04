import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Communique } from './communique.entity';
import { CreateCommuniqueDto } from './dto/communique.dto';
import { UpdateCommuniqueDto } from './dto/communique.dto';
import { CommuniqueUser, CommuniquePermission } from './dto/communique-permissions.dto';
import { User } from '../users/user.entity';
import { AdminUser } from '../admin/admin_users.entity';
import { UserCategory } from '../users/enums/user-category.enum';

@Injectable()
export class CommuniqueService {
  constructor(
    @InjectRepository(Communique)
    private readonly communiqueRepository: Repository<Communique>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  private async getUserInfo(userId: number | string): Promise<CommuniqueUser> {
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

  private getCommuniquePermissions(user: CommuniqueUser): CommuniquePermission {
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
          // These admin roles can create and manage their own communiques
          return {
            canCreate: true,
            canUpdate: true,
            canDelete: true,
            canViewAll: true,
            canManageOthers: false, // Can only manage their own communiques
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
          canManageOthers: false, // Can only manage their own communiques
        };
      }
      
      if (user.categories?.includes(UserCategory.COMMITTEE)) {
        return {
          canCreate: true,
          canUpdate: true,
          canDelete: false, // Only SUPER_ADMIN can delete
          canViewAll: true,
          canManageOthers: false, // Can only manage their own communiques
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

  private async canManageCommunique(communiqueId: number, user: CommuniqueUser): Promise<boolean> {
    const permissions = this.getCommuniquePermissions(user);
    
    if (permissions.canManageOthers) {
      return true; // SUPER_ADMIN can manage all communiques
    }

    if (!permissions.canUpdate) {
      return false; // No update permissions
    }

    // Check if user owns the communique
    const communique = await this.communiqueRepository.findOne({
      where: { id: communiqueId },
      select: ['createdById']
    });

    return communique ? communique.createdById === user.id : false;
  }

  async create(createCommuniqueDto: CreateCommuniqueDto, userId: number): Promise<Communique> {
    const user = await this.getUserInfo(userId);
    const permissions = this.getCommuniquePermissions(user);

    if (!permissions.canCreate) {
      throw new ForbiddenException('You do not have permission to create communiques. Only SUPER_ADMIN role, other admin roles, or users with LEAD/COMMITTEE category can create communiques.');
    }
    const communique = this.communiqueRepository.create({
      ...createCommuniqueDto,
      createdById: user.id,
    });
    
    const result = await this.communiqueRepository.save(communique);
    return Array.isArray(result) ? result[0] : result;
  }

  async findAll(): Promise<Communique[]> {
    return await this.communiqueRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Communique> {
    const communique = await this.communiqueRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!communique) {
      throw new NotFoundException(`Communique with ID ${id} not found`);
    }

    return communique;
  }

  async update(id: number, updateCommuniqueDto: UpdateCommuniqueDto, userId: number): Promise<Communique> {
    const user = await this.getUserInfo(userId);
    const canManage = await this.canManageCommunique(id, user);

    if (!canManage) {
      throw new ForbiddenException(`You can only update communiques you created or have admin permissions. User: ${JSON.stringify(user)}, Communique ID: ${id}`);
    }
    
    const communique = await this.findOne(id);
    Object.assign(communique, updateCommuniqueDto);
    
    return await this.communiqueRepository.save(communique);
  }

  async remove(id: number, userId: number): Promise<void> {
    const user = await this.getUserInfo(userId);
    const canManage = await this.canManageCommunique(id, user);

    if (!canManage) {
      throw new ForbiddenException('You can only delete communiques you created or have admin permissions');
    }
    
    const communique = await this.findOne(id);
    await this.communiqueRepository.remove(communique);
  }

  async getUserPermissions(userId: number): Promise<CommuniquePermission> {
    const user = await this.getUserInfo(userId);
    return this.getCommuniquePermissions(user);
  }
}
