import { IsOptional, IsEnum, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceEventType, AttendanceStatus } from '../attendance.entity';

export class AttendanceFilterDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

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