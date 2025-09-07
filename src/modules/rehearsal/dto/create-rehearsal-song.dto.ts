import { IsNotEmpty, IsOptional, IsArray, IsNumber, IsString, IsEnum, IsBoolean, ValidateNested } from 'class-validator';
import { SongDifficulty } from '../../song/song.entity';
import { MusicalKey } from '../rehearsal-song.entity';
import { Type } from 'class-transformer';
import { CreateRehearsalSongMusicianDto } from './create-rehearsal-song-musician.dto';
import { CreateRehearsalVoicePartDto } from './create-rehearsal-voice-part.dto';

export class CreateRehearsalSongDto {
  @IsNotEmpty()
  @IsNumber()
  songId: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  leadSingerIds?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  chorusMemberIds?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRehearsalSongMusicianDto)
  musicians?: CreateRehearsalSongMusicianDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRehearsalVoicePartDto)
  voiceParts?: CreateRehearsalVoicePartDto[];

  @IsOptional()
  @IsEnum(SongDifficulty)
  difficulty?: SongDifficulty;

  @IsOptional()
  @IsBoolean()
  needsWork?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsNumber()
  timeAllocated?: number;

  @IsOptional()
  @IsString()
  focusPoints?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(MusicalKey)
  musicalKey?: MusicalKey; // Musical key (gamme) for the song
}
