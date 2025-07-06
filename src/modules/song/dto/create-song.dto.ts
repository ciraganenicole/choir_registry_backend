import { IsString, IsEnum, IsOptional, IsArray, IsDateString, IsInt, IsNumber } from 'class-validator';
import { SongDifficulty, SongStatus } from '../song.entity';

export class CreateSongDto {
  @IsString()
  title: string;

  @IsString()
  composer: string;

  @IsString()
  genre: string;

  @IsString()
  duration: string;

  @IsEnum(SongDifficulty)
  difficulty: SongDifficulty;

  @IsEnum(SongStatus)
  status: SongStatus;

  @IsArray()
  @IsString({ each: true })
  voice_parts: string[];

  @IsString()
  lyrics: string;

  @IsOptional()
  @IsInt()
  times_performed?: number;

  @IsOptional()
  @IsDateString()
  last_performed?: string;
} 