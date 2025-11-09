import { IsDateString, IsOptional, IsString, MaxLength, IsNumber } from 'class-validator';

export class CreateLouadoShiftDto {
  @IsDateString()
  date: string;

  @IsNumber()
  louangeId: number;

  @IsNumber()
  adorationId: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

