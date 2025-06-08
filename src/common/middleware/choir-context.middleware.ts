import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChoirContextMiddleware implements NestMiddleware {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        // Skip middleware for public routes
        if (this.isPublicRoute(req.path)) {
            return next();
        }

        const token = this.extractTokenFromHeader(req);
        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_SECRET')
            });

            // Add choir context to request
            req['choirContext'] = {
                choirId: payload.choirId,
                role: payload.role
            };

            next();
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }

    private isPublicRoute(path: string): boolean {
        const publicRoutes = [
            '/auth/login',
            '/auth/register',
            '/auth/refresh'
        ];
        return publicRoutes.some(route => path.startsWith(route));
    }
} 