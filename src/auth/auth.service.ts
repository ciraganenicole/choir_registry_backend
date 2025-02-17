import { Injectable, UnauthorizedException, ConflictException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AdminUsersService } from "../admin/admin_users.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private jwtService: JwtService,
        private adminUsersService: AdminUsersService
    ) {}

    async validateUser(email: string, pass: string) {
        const user = await this.adminUsersService.findOneByEmail(email);
        if (!user) {
            throw new UnauthorizedException("Invalid email");
        }

        const isPasswordValid = await bcrypt.compare(pass, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid password");
        }

        return { id: user.id, email: user.email };
    }

    async login(email: string, password: string) {
        const user = await this.validateUser(email, password);
        const payload = { email: user.email, sub: user.id };
        return { access_token: this.jwtService.sign(payload) };
    }

    async createHardcodedAdmin() {
        const email = "useradmin@example.com";
        const password = "password123";

        // Check if the user already exists
        const existingUser = await this.adminUsersService.findOneByEmail(email);
        if (existingUser) {
            this.logger.warn("Hardcoded admin user already exists.");
            return { message: "Admin user already exists", user: existingUser };
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create and save the user
        try {
            const newUser = await this.adminUsersService.create({
                email,
                password: hashedPassword,
            });

            this.logger.log("Hardcoded admin user created successfully.");
            return {
                message: "Admin user created successfully",
                user: { id: newUser.id, email: newUser.email },
            };
        } catch (error) {
            this.logger.error("Error creating hardcoded admin user", error);
            throw new ConflictException("Error creating admin user");
        }
    }
}
