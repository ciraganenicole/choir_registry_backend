import { IsOptional, IsString, IsEnum, IsArray, IsInt, Min, MaxLength, IsDateString } from 'class-validator';
import { SongDifficulty, SongStatus } from '../song.entity';

export class UpdateSongDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  composer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  genre?: string;

  @IsOptional()
  @IsEnum(SongDifficulty)
  difficulty?: SongDifficulty;

  @IsOptional()
  @IsEnum(SongStatus)
  status?: SongStatus;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  lyrics?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  times_performed?: number;

  @IsOptional()
  @IsDateString()
  last_performed?: string;
} 