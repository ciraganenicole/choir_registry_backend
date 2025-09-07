import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { SongDifficulty, SongStatus } from '../song.entity';

export class SongFilterDto {
  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsEnum(SongDifficulty)
  difficulty?: SongDifficulty;

  @IsOptional()
  @IsEnum(SongStatus)
  status?: SongStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: 'title' | 'composer' | 'genre' | 'created_at' | 'difficulty' = 'created_at';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
} 