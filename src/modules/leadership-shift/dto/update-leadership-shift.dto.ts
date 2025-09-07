import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadershipShiftDto } from './create-leadership-shift.dto';

export class UpdateLeadershipShiftDto extends PartialType(CreateLeadershipShiftDto) {} 