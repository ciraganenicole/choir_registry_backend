import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateParticipationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  contact: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  programmeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  programmeTitle?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  occurrenceDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
