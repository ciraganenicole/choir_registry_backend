import { IsNotEmpty, IsEnum, IsDate, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus, AttendanceType, AttendanceEventType, JustificationReason } from '../attendance.entity';

export class CreateAttendanceDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsEnum(AttendanceEventType)
    eventType: AttendanceEventType;

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    date: Date;

    @IsNotEmpty()
    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @IsOptional()
    @IsEnum(AttendanceType)
    type?: AttendanceType;

    @IsOptional()
    @IsEnum(JustificationReason)
    justification?: JustificationReason;
} 