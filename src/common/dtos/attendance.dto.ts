import { IsNumber, IsEnum, IsOptional } from 'class-validator';
import { AttendanceStatus } from '../../modules/attendance/attendance.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateAttendanceDto {
    @IsNumber()
    userId: number;

    @IsEnum(AttendanceStatus)
    status: AttendanceStatus;
}

export class CheckInOutDto {
    @IsNumber()
    userId: number;
}

export class MarkAttendanceDto {
    @ApiProperty({ description: 'User ID', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    userId: number;

    @ApiProperty({ description: 'Event ID', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    eventId: number;
}

export class JustifyAttendanceDto {
    @ApiProperty({ description: 'Justification status', example: true })
    @IsNotEmpty()
    justified: boolean;
} 