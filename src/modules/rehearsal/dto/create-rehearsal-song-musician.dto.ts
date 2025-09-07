import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';

export class CreateRehearsalSongMusicianDto {
  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  instrument?: string;



  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  practiceNotes?: string;

  @IsOptional()
  @IsBoolean()
  needsPractice?: boolean;

  @IsOptional()
  @IsBoolean()
  isSoloist?: boolean;

  @IsOptional()
  @IsBoolean()
  isAccompanist?: boolean;

  @IsOptional()
  @IsNumber()
  soloStartTime?: number;

  @IsOptional()
  @IsNumber()
  soloEndTime?: number;

  @IsOptional()
  @IsString()
  soloNotes?: string;

  @IsOptional()
  @IsString()
  accompanimentNotes?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsNumber()
  timeAllocated?: number;
}
