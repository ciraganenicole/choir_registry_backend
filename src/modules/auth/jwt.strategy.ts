import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AdminUsersService } from '../admin/admin_users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private adminUsersService: AdminUsersService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret_key',
        });
    }

    async validate(payload: any) {
        const user = await this.adminUsersService.findById(payload.sub);
        if (!user || !user.isActive) {
            throw new UnauthorizedException('User is not active or not found');
        }

        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            name: payload.name
        };
    }
} 