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
  gender: Gender;

  @IsEnum(MaritalStatus)
  maritalStatus: MaritalStatus;

  @IsEnum(EducationLevel)
  educationLevel: EducationLevel;

  @IsEnum(Profession)
  profession: Profession;

  @IsString()
  @IsOptional()
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

  @IsString()
  phoneNumber: string;

  @IsString()
  @IsOptional()
  whatsappNumber?: string;

  @IsEmail()
  email: string;

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