import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { Gender } from '../enums/gender.enum';
import { MaritalStatus } from '../enums/marital-status.enum';
import { EducationLevel } from '../enums/education-level.enum';
import { Profession } from '../enums/profession.enum';
import { Commune } from '../enums/commune.enum';
import { Commission } from '../enums/commission.enum';
import { UserCategory } from '../enums/user-category.enum';

export class UserFilterDto {
    @IsOptional()
    @IsString()
    search?: string;

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
    @IsNumber()
    page?: number;

    @IsOptional()
    @IsNumber()
    limit?: number;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsString()
    order?: 'ASC' | 'DESC';

    @IsOptional()
    @IsString()
    letter?: string;
} 