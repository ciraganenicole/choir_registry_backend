import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AdminUsersService } from '../admin/admin_users.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private adminUsersService: AdminUsersService,
        private usersService: UsersService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret_key',
        });
    }

    async validate(payload: any) {
        // Check if this is an admin user or regular user based on payload type
        if (payload.type === 'admin') {
            // Handle admin user
            const adminUser = await this.adminUsersService.findById(payload.sub);
            if (adminUser && adminUser.isActive) {
                return {
                    id: payload.sub,
                    email: payload.email,
                    role: payload.role,
                    username: payload.username,
                    type: 'admin'
                };
            }
        } else if (payload.type === 'user') {
            // Handle regular user (including LEAD users)
            const regularUser = await this.usersService.findByIdForAuth(payload.sub);
            if (regularUser && regularUser.isActive) {
                return {
                    id: payload.sub,
                    email: payload.email,
                    categories: regularUser.categories,
                    firstName: regularUser.firstName,
                    lastName: regularUser.lastName,
                    role: payload.role, // Include the role we added in auth service
                    type: 'user'
                };
            }
        }

        throw new UnauthorizedException('User is not active or not found');
    }
} 