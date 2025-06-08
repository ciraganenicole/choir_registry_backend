import { IsString, IsOptional, IsEmail, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChoirDto {
    @ApiProperty({ example: 'St. Mary\'s Choir' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'A vibrant choir dedicated to praising God through music', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'St. Mary\'s Catholic Church' })
    @IsString()
    church: string;

    @ApiProperty({ example: 'https://example.com/logo.png', required: false })
    @IsString()
    @IsOptional()
    logo?: string;

    @ApiProperty({ example: 'United States', required: false })
    @IsString()
    @IsOptional()
    country?: string;

    @ApiProperty({ example: 'New York', required: false })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiProperty({ example: '123 Church Street', required: false })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiProperty({ example: '+1234567890', required: false })
    @IsPhoneNumber()
    @IsOptional()
    contactPhone?: string;

    @ApiProperty({ example: 'contact@stmaryschoir.com', required: false })
    @IsEmail()
    @IsOptional()
    contactEmail?: string;
}

export class RegisterChoirAdminDto {
    @ApiProperty({ example: 'John Doe' })
    @IsString()
    username: string;

    @ApiProperty({ example: 'john@stmaryschoir.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    password: string;
} 