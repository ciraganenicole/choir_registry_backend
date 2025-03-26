import { IsNotEmpty, IsNumber, IsEnum, IsDate, IsString, IsOptional, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceEventType, AttendanceStatus, AttendanceType } from '../attendance.entity';

export class CreateAttendanceDto {
    @IsNotEmpty()
    @IsNumber()
    userId: number;

    @IsNotEmpty()
    @IsString()
    eventName: string;

    @IsNotEmpty()
    @IsEnum(AttendanceEventType)
    eventType: AttendanceEventType;

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    date: Date;

    @IsNotEmpty()
    @IsString()
    @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'Start time must be in HH:MM format'
    })
    startTime: string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'End time must be in HH:MM format'
    })
    endTime: string;

    @IsNotEmpty()
    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;

    @IsOptional()
    @IsEnum(AttendanceType)
    type?: AttendanceType;
} 