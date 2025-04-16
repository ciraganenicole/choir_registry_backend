import { IsOptional, IsNumber, IsEnum, IsDate, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceEventType, AttendanceStatus, AttendanceType, JustificationReason } from '../attendance.entity';
import { PartialType } from '@nestjs/mapped-types';
import { CreateAttendanceDto } from './create-attendance.dto';

export class UpdateAttendanceDto extends PartialType(CreateAttendanceDto) {
    @IsOptional()
    @IsNumber()
    userId?: number;

    @IsOptional()
    @IsString()
    eventName?: string;

    @IsOptional()
    @IsEnum(AttendanceEventType)
    eventType?: AttendanceEventType;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    date?: Date;

    @IsOptional()
    @IsString()
    startTime?: string;

    @IsOptional()
    @IsString()
    endTime?: string;

    @IsOptional()
    @IsEnum(AttendanceStatus)
    status?: AttendanceStatus;

    @IsOptional()
    @IsEnum(AttendanceType)
    type?: AttendanceType;

    @IsOptional()
    @IsBoolean()
    justified?: boolean;

    @IsOptional()
    @IsEnum(JustificationReason)
    justification?: JustificationReason;
} 