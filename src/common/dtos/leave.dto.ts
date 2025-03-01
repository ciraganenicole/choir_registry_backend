import { IsNumber, IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LeaveType {
    SICK = 'sick',
    VACATION = 'vacation',
    PERSONAL = 'personal',
    SUSPENSION = 'suspension',
    WORK = 'work',
    OTHER = 'other'
}

export class CreateLeaveDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    userId: number;

    @ApiProperty({ example: '2024-03-20' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '2024-03-21', required: false })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsEnum(LeaveType)
    leaveType: LeaveType;
}

export class UpdateLeaveDto {
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @IsEnum(LeaveType)
    leaveType?: LeaveType;
} 