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
        console.log(`Attempting login for email: ${email}`);
    
        const user = await this.adminUsersService.findOneByEmail(email);
        if (!user) {
            console.log("User not found.");
            throw new UnauthorizedException("Invalid email");
        }
    
        console.log(`User found: ${user.email}`);
    
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log("Password incorrect.");
            throw new UnauthorizedException("Invalid password");
        }
    
        console.log("Login successful.");
        const payload = { email: user.email, sub: user.id };
        return { access_token: this.jwtService.sign(payload), user };
    }
    

    async createHardcodedAdmin() {
        const email = "admin@example.com";
        const password = "password123"; // Hardcoded password
    
        const existingUser = await this.adminUsersService.findOneByEmail(email);
        if (existingUser) {
            this.logger.warn("Hardcoded admin user already exists.");
            console.log("Admin user already exists:", existingUser);
            return { message: "Admin user already exists", user: existingUser };
        }
    
        try {
            // Hash the password using bcrypt
            const hashedPassword = await bcrypt.hash(password, 10);
    
            const hardcodedUser = { email, password: hashedPassword };
    
            console.log("Inserting hardcoded user:", hardcodedUser);
    
            // Now insert the user with the hashed password
            await this.adminUsersService.createAdminUser(hardcodedUser);
    
            this.logger.log("Hardcoded admin user inserted successfully.");
            return {
                message: "Admin user inserted successfully",
                user: { email: hardcodedUser.email },
            };
        } catch (error) {
            this.logger.error("Error inserting hardcoded admin user", error);
            throw new ConflictException("Error inserting admin user");
        }
    }
    
    
}
