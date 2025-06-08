import { IsNotEmpty, IsEnum, IsDate, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus, AttendanceType, AttendanceEventType, JustificationReason } from '../attendance.entity';

export class CreateAttendanceDto {
    @IsNotEmpty()
    @IsString()
    userId: string;

    @IsNotEmpty()
    @IsUUID()
    choirId: string;

    @IsNotEmpty()
    @IsEnum(AttendanceEventType)
    eventType: AttendanceEventType;

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    date: Date | string;

    @IsNotEmpty()
    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @IsOptional()
    @IsEnum(AttendanceType)
    type?: AttendanceType;

    @IsOptional()
    @IsEnum(JustificationReason)
    justification?: JustificationReason;

    @IsOptional()
    @IsString()
    timeIn?: string;
} 