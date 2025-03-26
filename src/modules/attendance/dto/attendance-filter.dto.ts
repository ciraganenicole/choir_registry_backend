import { IsOptional, IsEnum, IsString, IsNumber, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceEventType, AttendanceStatus } from '../attendance.entity';

export class AttendanceFilterDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    startDate?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endDate?: Date;

    @IsOptional()
    @IsNumber()
    userId?: number;

    @IsOptional()
    @IsEnum(AttendanceEventType)
    eventType?: AttendanceEventType;

    @IsOptional()
    @IsEnum(AttendanceStatus)
    status?: AttendanceStatus;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    limit?: number;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsString()
    sortOrder?: 'ASC' | 'DESC';
} 