import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLinkedStubDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;
}
