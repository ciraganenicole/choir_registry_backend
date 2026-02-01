import { IsString, IsNotEmpty, IsOptional, IsUrl, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDate()
  @Type(() => Date)
  meetingDate: Date;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  @IsUrl()
  attachmentUrl?: string;
}

export class UpdateReportDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  meetingDate?: Date;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @Transform(({ value }) => value === '' ? null : value)
  @IsUrl()
  attachmentUrl?: string;
}
