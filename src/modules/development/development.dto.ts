import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
export class DevelopmentAccessDto {
  @IsString({ message: 'Le numéro de téléphone est obligatoire.' })
  @MaxLength(40, { message: 'Le numéro de téléphone est trop long.' })
  phone: string;
  @IsOptional()
  @IsIn(['personal', 'directory'], { message: 'Le parcours demandé est invalide.' })
  purpose?: 'personal' | 'directory';
}
export class DevelopmentSpecialtyInput {
  @IsOptional() @IsInt() @Min(1) id?: number;
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsInt() @Min(1) subcategoryId?: number;
}
export class SaveDevelopmentProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Le nom complet est obligatoire.' })
  @MaxLength(160, { message: 'Le nom complet est limité à 160 caractères.' })
  fullName: string;
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'La description est limitée à 2 000 caractères.' })
  description?: string;
  @Transform(({ value }) => {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed)
        ? parsed.map((v) => Object.assign(new DevelopmentSpecialtyInput(), v))
        : parsed;
    } catch {
      return null;
    }
  })
  @IsArray({ message: 'La liste des spécialités est invalide.' })
  @ArrayMinSize(1, { message: 'Choisissez au moins une spécialité.' })
  @ArrayMaxSize(30, { message: 'Vous pouvez sélectionner au maximum 30 spécialités.' })
  @ValidateNested({ each: true })
  specialties: DevelopmentSpecialtyInput[];
}
export class DevelopmentPeopleQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional()
  @Type(() => Number)
  @IsIn([12, 24, 48], { message: 'Choisissez 12, 24 ou 48 personnes par page.' })
  limit = 12;
  @IsOptional() @IsString() @MaxLength(160) search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) sectorId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) subcategoryId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) specialtyId?: number;
}
