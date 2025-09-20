import { IsNotEmpty, IsDateString, IsEnum, IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerformanceType, PerformanceStatus } from '../performance.entity';

export class CreatePerformanceDto {
  @ApiProperty({
    description: 'Performance date and time',
    example: '2024-01-15T19:00:00Z',
    type: String,
    format: 'date-time'
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Performance location',
    example: 'Main Sanctuary',
    type: String
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: 'Expected audience size',
    example: 200,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  expectedAudience?: number;

  @ApiProperty({
    description: 'Type of performance',
    enum: PerformanceType,
    example: PerformanceType.WORSHIP_SERVICE
  })
  @IsNotEmpty()
  @IsEnum(PerformanceType)
  type: PerformanceType;

  @ApiPropertyOptional({
    description: 'ID of the shift lead for this performance (optional - can be assigned later)',
    example: 123,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  shiftLeadId?: number;

  @ApiPropertyOptional({
    description: 'Additional notes for the performance',
    example: 'Sunday evening service',
    type: String
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Performance status',
    enum: PerformanceStatus,
    default: PerformanceStatus.UPCOMING,
    example: PerformanceStatus.UPCOMING
  })
  @IsOptional()
  @IsEnum(PerformanceStatus)
  status?: PerformanceStatus;
} 