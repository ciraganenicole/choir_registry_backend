import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { ChoirModule } from '../choir/choir.module';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { GuardsModule } from '../../common/guards/guards.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        UsersModule,
        ChoirModule,
        PassportModule,
        GuardsModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { 
                    expiresIn: configService.get<string>('JWT_EXPIRATION') || '1h'
                },
            }),
            inject: [ConfigService],
        }),
        ConfigModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule {} 