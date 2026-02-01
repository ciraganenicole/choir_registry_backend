import { IsNotEmpty, IsEnum, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { AttendanceStatus, AttendanceType, AttendanceEventType, JustificationReason } from '../attendance.entity';

export class CreateAttendanceDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsEnum(AttendanceEventType)
    eventType: AttendanceEventType;

    @IsNotEmpty()
    @IsDateString()
    date: string;

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