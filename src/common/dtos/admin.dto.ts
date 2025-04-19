import { IsEmail, IsString, IsEnum, IsOptional, MinLength, IsPhoneNumber } from 'class-validator';
import { AdminRole } from '../../modules/admin/admin-role.enum';

export class CreateAdminDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    username: string;

    @IsOptional()
    @IsEnum(AdminRole)
    role?: AdminRole;
}

export class UpdateAdminDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;

    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsEnum(AdminRole)
    role?: AdminRole;

    @IsOptional()
    @IsPhoneNumber()
    phoneNumber?: string;

    @IsOptional()
    isActive?: boolean;
} 