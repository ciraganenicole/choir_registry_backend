import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminUser } from "./admin_users.entity";
import { CreateAdminDto, UpdateAdminDto } from "../../common/dtos/admin.dto";
import { AdminRole } from "./admin-role.enum";
import * as bcrypt from "bcrypt";

@Injectable()
export class AdminUsersService {
    constructor(
        @InjectRepository(AdminUser)
        private adminUserRepository: Repository<AdminUser>
    ) {}

    async createAdmin(userData: CreateAdminDto, currentUserRole: AdminRole): Promise<AdminUser> {
        // Only SUPER_ADMIN can create other admins
        if (currentUserRole !== AdminRole.SUPER_ADMIN) {
            throw new UnauthorizedException('Only super admins can create new admins');
        }

        const existingUser = await this.findOneByEmail(userData.email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const newUser = this.adminUserRepository.create({
            ...userData,
            password: hashedPassword
        });

        return this.adminUserRepository.save(newUser);
    }

    async findOneByEmail(email: string): Promise<AdminUser | null> {
        return this.adminUserRepository.findOne({ where: { email } });
    }
    
    async findById(id: string): Promise<AdminUser> {
        const admin = await this.adminUserRepository.findOne({ where: { id } });
        if (!admin) {
            throw new NotFoundException('Admin not found');
        }
        return admin;
    }

    async updateAdmin(id: string, updateData: UpdateAdminDto, currentUserRole: AdminRole): Promise<AdminUser> {
        const admin = await this.findById(id);

        // Only SUPER_ADMIN can update roles or other SUPER_ADMINs
        if (currentUserRole !== AdminRole.SUPER_ADMIN && 
            (updateData.role || admin.role === AdminRole.SUPER_ADMIN)) {
            throw new UnauthorizedException('Insufficient permissions');
        }

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        await this.adminUserRepository.update(id, updateData);
        return this.findById(id);
    }

    async deactivateAdmin(id: string, currentUserRole: AdminRole): Promise<void> {
        const admin = await this.findById(id);

        if (currentUserRole !== AdminRole.SUPER_ADMIN || admin.role === AdminRole.SUPER_ADMIN) {
            throw new UnauthorizedException('Cannot deactivate this admin');
        }

        await this.adminUserRepository.update(id, { isActive: false });
    }

    async getAdminsByRole(role: AdminRole): Promise<AdminUser[]> {
        return this.adminUserRepository.find({ where: { role, isActive: true } });
    }

    async getAllAdmins(currentUserRole: AdminRole): Promise<AdminUser[]> {
        // Only SUPER_ADMIN can see all admins including other SUPER_ADMINs
        if (currentUserRole === AdminRole.SUPER_ADMIN) {
            return this.adminUserRepository.find();
        }
        // Other admins can only see non-SUPER_ADMIN users
        return this.adminUserRepository.find({
            where: [
                { role: AdminRole.CHOIR_ADMIN },
                { role: AdminRole.LOUADO_ADMIN },
                { role: AdminRole.ADMINISTRATION_ADMIN },
                { role: AdminRole.CAISSE_ADMIN }
            ]
        });
    }
} 