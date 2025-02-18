import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AdminUser } from "./admin_users.entity";

@Injectable()
export class AdminUsersService {
    constructor(
        @InjectRepository(AdminUser)
        private adminUserRepository: Repository<AdminUser>
    ) {}

    async createAdminUser(userData: Partial<AdminUser>): Promise<AdminUser> {
        const newUser = this.adminUserRepository.create(userData);
        return this.adminUserRepository.save(newUser);
    }

    async findOneByEmail(email: string): Promise<AdminUser | undefined> {
        return this.adminUserRepository.findOne({ where: { email } });
    }
}
