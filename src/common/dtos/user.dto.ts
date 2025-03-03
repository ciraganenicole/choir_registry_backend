import { IsString, IsEnum, IsEmail, IsOptional, IsArray, IsPhoneNumber } from 'class-validator';
import { UserCategory } from '../../modules/users/enums/user-category.enum';
import { Gender } from '../../modules/users/enums/gender.enum';
import { MaritalStatus } from '../../modules/users/enums/marital-status.enum';
import { EducationLevel } from '../../modules/users/enums/education-level.enum';
import { Profession } from '../../modules/users/enums/profession.enum';
import { Commune } from '../../modules/users/enums/commune.enum';
import { Commission } from '../../modules/users/enums/commission.enum';

export class CreateUserDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEnum(Gender)
    gender: Gender;

    @IsEnum(MaritalStatus)
    maritalStatus: MaritalStatus;

    @IsEnum(EducationLevel)
    educationLevel: EducationLevel;

    @IsEnum(Profession)
    profession: Profession;

    @IsOptional()
    @IsString()
    competenceDomain?: string;

    @IsString()
    churchOfOrigin: string;

    @IsEnum(Commune)
    commune: Commune;

    @IsString()
    quarter: string;

    @IsString()
    reference: string;

    @IsString()
    address: string;

    @IsPhoneNumber()
    phoneNumber: string;

    @IsOptional()
    @IsPhoneNumber()
    whatsappNumber?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsArray()
    @IsEnum(Commission, { each: true })
    commissions: Commission[];

    @IsArray()
    @IsEnum(UserCategory, { each: true })
    categories: UserCategory[];
}

export class UpdateUserDto extends CreateUserDto {

    // ... make all fields optional for updates
} 