import { IsString, IsEnum, IsOptional, IsEmail, IsBoolean, IsDate } from 'class-validator';
import { Gender } from '../enums/gender.enum';
import { MaritalStatus } from '../enums/marital-status.enum';
import { EducationLevel } from '../enums/education-level.enum';
import { Profession } from '../enums/profession.enum';
import { Commune } from '../enums/commune.enum';
import { Commission } from '../enums/commission.enum';
import { UserCategory } from '../enums/user-category.enum';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsEnum(MaritalStatus)
  @IsOptional()
  maritalStatus?: MaritalStatus;

  @IsEnum(EducationLevel)
  @IsOptional()
  educationLevel?: EducationLevel;

  @IsEnum(Profession)
  @IsOptional()
  profession?: Profession;

  @IsString()
  @IsOptional()
  competenceDomain?: string;

  @IsString()
  @IsOptional()
  churchOfOrigin?: string;

  @IsEnum(Commune)
  @IsOptional()
  commune?: Commune;

  @IsString()
  @IsOptional()
  quarter?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(Commission, { each: true })
  @IsOptional()
  commissions?: Commission[];

  @IsEnum(UserCategory, { each: true })
  @IsOptional()
  categories?: UserCategory[];

  @IsString()
  @IsOptional()
  fingerprintData?: string;

  @IsString()
  @IsOptional()
  voiceCategory?: string;

  @IsDate()
  @IsOptional()
  joinDate?: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  profileImageUrl?: string;
} 