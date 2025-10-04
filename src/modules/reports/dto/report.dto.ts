import { IsString, IsNotEmpty, IsOptional, IsUrl, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDate()
  @Type(() => Date)
  meetingDate: Date;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  meetingDate?: Date;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}
