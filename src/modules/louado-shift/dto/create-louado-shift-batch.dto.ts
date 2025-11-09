import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateLouadoShiftDto } from './create-louado-shift.dto';

export class CreateLouadoShiftBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLouadoShiftDto)
  assignments: CreateLouadoShiftDto[];
}

