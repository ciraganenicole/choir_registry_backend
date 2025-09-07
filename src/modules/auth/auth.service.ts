import { Injectable, UnauthorizedException, ConflictException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AdminUsersService } from "../admin/admin_users.service";
import { UsersService } from "../users/users.service";
import { LoginDto, RegisterAdminDto } from "../../common/dtos/auth.dto";
import { CreateAdminDto } from "../../common/dtos/admin.dto";
import * as bcrypt from "bcrypt";
import { AdminRole } from "../admin/admin-role.enum";
import { UserCategory } from "../users/enums/user-category.enum";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private jwtService: JwtService,
        private adminUsersService: AdminUsersService,
        private usersService: UsersService
    ) {}

    async validateUser(email: string, pass: string) {
        // First try to find as admin user
        const adminUser = await this.adminUsersService.findOneByEmail(email);
        if (adminUser && adminUser.isActive) {
            const isPasswordValid = await bcrypt.compare(pass, adminUser.password);
            if (isPasswordValid) {
                return { id: adminUser.id, email: adminUser.email, role: adminUser.role, type: 'admin' };
            }
        }

        // If not found as admin, try as regular user
        const regularUser = await this.usersService.validateUserCredentials(email, pass);
        if (regularUser) {
            return { 
                id: regularUser.id, 
                email: regularUser.email, 
                categories: regularUser.categories,
                firstName: regularUser.firstName,
                lastName: regularUser.lastName,
                type: 'user'
            };
        }

        throw new UnauthorizedException('Invalid credentials or inactive account');
    }

    async login(loginDto: LoginDto) {
        // First try to find as admin user
        const admin = await this.adminUsersService.findOneByEmail(loginDto.email);
        if (admin && admin.isActive) {
            const isPasswordValid = await bcrypt.compare(loginDto.password, admin.password);
            if (isPasswordValid) {
                const payload = { 
                    sub: admin.id, 
                    email: admin.email,
                    username: admin.username,
                    role: admin.role,
                    type: 'admin'
                };

                return {
                    access_token: this.jwtService.sign(payload),
                    user: {
                        id: admin.id,
                        email: admin.email,
                        username: admin.username,
                        role: admin.role,
                        type: 'admin'
                    }
                };
            }
        }

        // If not found as admin, try as regular user
        const regularUser = await this.usersService.validateUserCredentials(loginDto.email, loginDto.password);
        if (regularUser) {
            // Determine role based on categories
            let role = 'USER';
            if (regularUser.categories?.includes(UserCategory.LEAD)) {
                role = UserCategory.LEAD;
            }

            const payload = { 
                sub: regularUser.id, 
                email: regularUser.email,
                firstName: regularUser.firstName,
                lastName: regularUser.lastName,
                categories: regularUser.categories,
                role: role,
                type: 'user'
            };

            return {
                access_token: this.jwtService.sign(payload),
                user: {
                    id: regularUser.id,
                    email: regularUser.email,
                    firstName: regularUser.firstName,
                    lastName: regularUser.lastName,
                    categories: regularUser.categories,
                    role: role,
                    type: 'user'
                }
            };
        }

        throw new UnauthorizedException('Invalid credentials or inactive account');
    }

    async createInitialSuperAdmin() {
        const email = process.env.SUPER_ADMIN_EMAIL || "super.admin@example.com";
        const password = process.env.SUPER_ADMIN_PASSWORD || "superadmin123";
        const username = "Super Admin";

        const existingUser = await this.adminUsersService.findOneByEmail(email);
        if (existingUser) {
            this.logger.warn("Super admin already exists");
            return { message: "Super admin already exists" };
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const adminData: CreateAdminDto = {
                email,
                password: hashedPassword,
                username,
                role: AdminRole.SUPER_ADMIN
            };

            const superAdmin = await this.adminUsersService.createAdmin(adminData);

            this.logger.log("Super admin created successfully");
            return {
                message: "Super admin created successfully",
                user: {
                    id: superAdmin.id,
                    email: superAdmin.email,
                    username: superAdmin.username,
                    role: superAdmin.role
                }
            };
        } catch (error) {
            this.logger.error("Error creating super admin", error);
            throw new ConflictException("Error creating super admin");
        }
    }

    async refreshToken(userId: string) {
        const user = await this.adminUsersService.findById(parseInt(userId));
        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid or inactive user');
        }

        const payload = { 
            sub: user.id, 
            email: user.email,
            username: user.username,
            role: user.role
        };

        return {
            access_token: this.jwtService.sign(payload)
        };
    }
} 