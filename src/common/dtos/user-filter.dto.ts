import { IsEnum, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '../../modules/users/enums/gender.enum';
import { MaritalStatus } from '../../modules/users/enums/marital-status.enum';
import { EducationLevel } from '../../modules/users/enums/education-level.enum';
import { Profession } from '../../modules/users/enums/profession.enum';
import { Commune } from '../../modules/users/enums/commune.enum';
import { Commission } from '../../modules/users/enums/commission.enum';
import { UserCategory } from '../../modules/users/enums/user-category.enum';

export class UserFilterDto {
    @IsOptional()
    @IsString()
    search?: string; // For searching in firstName, lastName, email

    @IsOptional()
    @IsEnum(Gender)
    gender?: Gender;

    @IsOptional()
    @IsEnum(MaritalStatus)
    maritalStatus?: MaritalStatus;

    @IsOptional()
    @IsEnum(EducationLevel)
    educationLevel?: EducationLevel;

    @IsOptional()
    @IsEnum(Profession)
    profession?: Profession;

    @IsOptional()
    @IsEnum(Commune)
    commune?: Commune;

    @IsOptional()
    @IsEnum(Commission)
    commission?: Commission;

    @IsOptional()
    @IsEnum(UserCategory)
    category?: UserCategory;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsString()
    sortOrder?: 'ASC' | 'DESC';

    @IsOptional()
    @IsString()
    letter?: string; // For filtering by first letter of firstName
} 