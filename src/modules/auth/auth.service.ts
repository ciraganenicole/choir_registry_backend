import { Injectable, UnauthorizedException, ConflictException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { LoginDto, RegisterUserDto } from "../../common/dtos/auth.dto";
import { RegisterChoirAdminDto } from "../../common/dtos/choir.dto";
import * as bcrypt from "bcrypt";
import { UserRole } from "../users/enums/role.enum";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private jwtService: JwtService,
        private usersService: UsersService
    ) {}

    async validateUser(email: string, pass: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid credentials or inactive account');
        }

        const isPasswordValid = await bcrypt.compare(pass, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return { id: user.id, email: user.email, role: user.role };
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid credentials or inactive account');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { 
            sub: user.id, 
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            choirId: user.choirId
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                choirId: user.choirId
            }
        };
    }

    async registerChoirAdmin(registerDto: RegisterChoirAdminDto) {
        this.logger.debug('Registering choir admin:', registerDto);

        try {
            // Check if user already exists
            const existingUser = await this.usersService.findByEmail(registerDto.email);
            if (existingUser) {
                throw new ConflictException('Email already exists');
            }

            // Create new user with CHOIR_ADMIN role
            const hashedPassword = await bcrypt.hash(registerDto.password, 10);
            const userData: RegisterUserDto = {
                email: registerDto.email,
                password: hashedPassword,
                firstName: registerDto.username,
                lastName: '',
                role: UserRole.CHOIR_ADMIN
            };

            const user = await this.usersService.createUser(userData);

            // Generate JWT token with payload
            const payload = { 
                sub: user.id, 
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            };

            return {
                access_token: this.jwtService.sign(payload),
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    isActive: user.isActive,
                    createdAt: user.createdAt
                }
            };
        } catch (error) {
            this.logger.error('Error registering choir admin:', error);
            if (error instanceof ConflictException) {
                throw error;
            }
            throw new ConflictException('Error registering choir admin');
        }
    }

    async createInitialSuperAdmin() {
        const email = process.env.SUPER_ADMIN_EMAIL || "super.admin@example.com";
        const password = process.env.SUPER_ADMIN_PASSWORD || "superadmin123";
        const username = "Super Admin";

        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            this.logger.warn("Super admin already exists");
            return { message: "Super admin already exists" };
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const userData: RegisterUserDto = {
                email,
                password: hashedPassword,
                firstName: username,
                lastName: '',
                role: UserRole.SUPER_ADMIN
            };

            const superAdmin = await this.usersService.createUser(userData);

            this.logger.log("Super admin created successfully");
            return {
                message: "Super admin created successfully",
                user: {
                    id: superAdmin.id,
                    email: superAdmin.email,
                    firstName: superAdmin.firstName,
                    lastName: superAdmin.lastName,
                    role: superAdmin.role
                }
            };
        } catch (error) {
            this.logger.error("Error creating super admin", error);
            throw new ConflictException("Error creating super admin");
        }
    }

    async refreshToken(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.isActive) {
            throw new UnauthorizedException('Invalid or inactive user');
        }

        const payload = { 
            sub: user.id, 
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            choirId: user.choirId
        };

        return {
            access_token: this.jwtService.sign(payload)
        };
    }
} 