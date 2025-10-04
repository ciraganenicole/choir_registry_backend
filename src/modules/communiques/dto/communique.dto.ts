import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateCommuniqueDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}

export class UpdateCommuniqueDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}
