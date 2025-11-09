import { PartialType } from '@nestjs/mapped-types';
import { CreateLouadoShiftDto } from './create-louado-shift.dto';

export class UpdateLouadoShiftDto extends PartialType(CreateLouadoShiftDto) {}

