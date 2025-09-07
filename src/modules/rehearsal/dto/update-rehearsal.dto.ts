import { PartialType } from '@nestjs/mapped-types';
import { CreateRehearsalDto } from './create-rehearsal.dto';

export class UpdateRehearsalDto extends PartialType(CreateRehearsalDto) {}
