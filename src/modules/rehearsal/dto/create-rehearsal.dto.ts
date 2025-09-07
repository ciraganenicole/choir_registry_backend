import { IsNotEmpty, IsDateString, IsEnum, IsOptional, IsArray, IsNumber, IsString, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RehearsalType, RehearsalStatus } from '../rehearsal.entity';
import { CreateRehearsalSongDto } from './create-rehearsal-song.dto';

export class CreateRehearsalDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsEnum(RehearsalType)
  type: RehearsalType;

  @IsOptional()
  @IsEnum(RehearsalStatus)
  status?: RehearsalStatus;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsNotEmpty()
  @IsNumber()
  performanceId: number; // Link to performance (this rehearsal prepares for this performance)

  @IsOptional()
  @IsNumber()
  rehearsalLeadId?: number; // Who is leading this specific rehearsal (can be different from shift lead)

  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsNumber()
  shiftLeadId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  choirMemberIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRehearsalSongDto)
  rehearsalSongs?: CreateRehearsalSongDto[];
}
