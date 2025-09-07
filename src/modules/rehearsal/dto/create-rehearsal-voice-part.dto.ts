import { IsNotEmpty, IsOptional, IsArray, IsNumber, IsString, IsEnum, IsBoolean } from 'class-validator';
import { VoicePartType } from '../rehearsal-voice-part.entity';

export class CreateRehearsalVoicePartDto {
  @IsNotEmpty()
  @IsEnum(VoicePartType)
  voicePartType: VoicePartType;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  memberIds?: number[];

  @IsOptional()
  @IsBoolean()
  needsWork?: boolean;

  @IsOptional()
  @IsString()
  focusPoints?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsNumber()
  timeAllocated?: number;
}
