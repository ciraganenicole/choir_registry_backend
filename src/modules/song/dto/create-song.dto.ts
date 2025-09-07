import { IsString, IsEnum, IsArray, IsOptional, IsInt, Min, MaxLength, IsDateString } from 'class-validator';
import { SongDifficulty, SongStatus } from '../song.entity';

export class CreateSongDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(255)
  composer: string;

  @IsString()
  @MaxLength(100)
  genre: string;

  @IsEnum(SongDifficulty)
  difficulty: SongDifficulty;

  @IsEnum(SongStatus)
  status: SongStatus;

  @IsString()
  @MaxLength(10000)
  lyrics: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  times_performed?: number = 0;

  @IsOptional()
  @IsDateString()
  last_performed?: string;
} 