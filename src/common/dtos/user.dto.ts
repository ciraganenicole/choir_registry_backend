import { IsString, IsOptional, IsPhoneNumber, IsArray } from 'class-validator';
import { UserCategory } from '../../modules/users/user-category.enum';

export class CreateUserDto {
    @IsString()
    name: string;

    @IsString()
    surname: string;

    @IsPhoneNumber()
    phoneNumber: string;

    @IsOptional()
    @IsArray()
    categories?: UserCategory[];
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    surname?: string;

    @IsOptional()
    @IsPhoneNumber()
    phoneNumber?: string;

    @IsOptional()
    @IsArray()
    categories?: UserCategory[];
} 