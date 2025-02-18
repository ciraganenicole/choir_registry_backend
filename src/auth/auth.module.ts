import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AdminUsersService } from '../admin/admin_users.service';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUser } from '../admin/admin_users.entity';
import { ConfigModule } from '@nestjs/config';  // <-- Add this import
import { AuthController } from './auth.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_secret_key', // Store in .env
      signOptions: { expiresIn: '1h' },
    }),
    ConfigModule.forRoot(),  // <-- Add this line to import ConfigModule
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminUsersService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
