import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminUser } from "./admin_users.entity";
import { CreateAdminDto, UpdateAdminDto } from "../../common/dtos/admin.dto";
import * as bcrypt from "bcrypt";
import { AdminRole } from "./admin-role.enum";

@Injectable()
export class AdminUsersService {
    constructor(
        @InjectRepository(AdminUser)
        private adminUserRepository: Repository<AdminUser>
    ) {}

    async createAdmin(userData: CreateAdminDto): Promise<AdminUser> {
        const existingUser = await this.findOneByEmail(userData.email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const newUser = this.adminUserRepository.create({
            email: userData.email,
            password: hashedPassword,
            username: userData.username,
            role: userData.role || AdminRole.ATTENDANCE_ADMIN
        });

        return await this.adminUserRepository.save(newUser);
    }

    async findOneByEmail(email: string): Promise<AdminUser | null> {
        return this.adminUserRepository.findOne({ where: { email } });
    }
    
    async findById(id: number): Promise<AdminUser> {
        const admin = await this.adminUserRepository.findOne({ where: { id } });
        if (!admin) {
            throw new NotFoundException('Admin not found');
        }
        return admin;
    }

    async updateAdmin(id: number, updateData: UpdateAdminDto): Promise<AdminUser> {
        const admin = await this.findById(id);

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        await this.adminUserRepository.update(id, updateData);
        return this.findById(id);
    }

    async deactivateAdmin(id: number): Promise<void> {
        await this.findById(id);
        await this.adminUserRepository.update(id, { isActive: false });
    }

    async getAllAdmins(): Promise<AdminUser[]> {
        return this.adminUserRepository.find();
    }
} 