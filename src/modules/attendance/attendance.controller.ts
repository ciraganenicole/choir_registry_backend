import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Patch, 
    Delete, 
    Param, 
    Query, 
    ParseIntPipe,
    BadRequestException,
    NotFoundException,
    ValidationPipe,
    UsePipes,
    DefaultValuePipe,
} from '@nestjs/common';
import { API_ROUTES } from '../../common/routes/api.routes';
import { AttendanceService } from './attendance.service';
import { Attendance } from './attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
import { JustificationReason } from './attendance.entity';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiParam 
} from '@nestjs/swagger';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new attendance record' })
    @ApiResponse({ status: 201, description: 'Attendance record created successfully' })
    create(@Body() createAttendanceDto: CreateAttendanceDto) {
        return this.attendanceService.create(createAttendanceDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all attendance records with filters' })
    findAll(@Query() filterDto: AttendanceFilterDto) {
        return this.attendanceService.findAll(filterDto);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Get attendance records for a specific user' })
    findByUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() filterDto: AttendanceFilterDto
    ) {
        return this.attendanceService.findByUser(userId, filterDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific attendance record' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.attendanceService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update an attendance record' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateAttendanceDto: UpdateAttendanceDto
    ) {
        return this.attendanceService.update(id, updateAttendanceDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an attendance record' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.attendanceService.remove(id);
    }

    @Post('manual')
    @ApiOperation({ summary: 'Mark attendance manually' })
    markManualAttendance(@Body() createAttendanceDto: CreateAttendanceDto) {
        return this.attendanceService.markManualAttendance(createAttendanceDto);
    }

    @Patch(':id/justify')
    @ApiOperation({ summary: 'Justify an absence with a specific reason' })
    @ApiResponse({ status: 200, description: 'Absence justified successfully' })
    @ApiResponse({ status: 400, description: 'Cannot justify absence for a user on leave' })
    justifyAbsence(
        @Param('id', ParseIntPipe) id: number,
        @Body('justification') justification: JustificationReason
    ) {
        return this.attendanceService.justifyAbsence(id, justification);
    }

    @Get('stats/user/:userId')
    @ApiOperation({ summary: 'Get attendance statistics for a specific user' })
    async getUserStats(
        @Param('userId', ParseIntPipe) userId: number,
        @Query('startDate') startDate: Date,
        @Query('endDate') endDate: Date
    ) {
        return this.attendanceService.getUserAttendanceStats(userId, startDate, endDate);
    }

    @Get('stats/overall')
    @ApiOperation({ summary: 'Get overall attendance statistics' })
    async getOverallStats(
        @Query('startDate') startDate: Date,
        @Query('endDate') endDate: Date
    ) {
        return this.attendanceService.getAttendanceStats(startDate, endDate);
    }
}
