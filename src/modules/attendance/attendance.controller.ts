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
    UseGuards,
    Put
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRole } from '../admin/admin-role.enum';
import { UserCategory } from '../users/enums/user-category.enum';
import { AttendanceEventType } from './attendance.entity';
import { AttendanceStatus } from './attendance.entity';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) {}

    @Post()
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new attendance record' })
    @ApiResponse({ status: 201, description: 'Attendance record created successfully' })
    create(@Body() createAttendanceDto: CreateAttendanceDto) {
        return this.attendanceService.create(createAttendanceDto);
    }

    @Get()
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN, UserCategory.LEAD)
    @ApiOperation({ summary: 'Get all attendance records with filters' })
    findAll(@Query() filterDto: AttendanceFilterDto) {
        return this.attendanceService.findAll(filterDto);
    }

    @Get('user/:userId')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN, UserCategory.LEAD)
    @ApiOperation({ summary: 'Get attendance records for a specific user' })
    findByUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() filterDto: AttendanceFilterDto
    ) {
        return this.attendanceService.findByUser(userId, filterDto);
    }

    @Get('unjustified-weekly')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN, UserCategory.LEAD)
    @ApiOperation({ summary: 'Get list of people who were absent without justification on Wednesday and Saturday of the week' })
    @ApiResponse({ status: 200, description: 'List of unjustified absences from Wednesday and Saturday' })
    async getUnjustifiedWeeklyAbsences() {
        return this.attendanceService.findUnjustifiedAbsencesFromWeek();
    }

    @Get(':id')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get a specific attendance record' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.attendanceService.findOne(id);
    }

    @Put(':id')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update an attendance record' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateAttendanceDto: UpdateAttendanceDto
    ) {
        return this.attendanceService.update(id, updateAttendanceDto);
    }

    @Delete(':id')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete an attendance record' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.attendanceService.remove(id);
    }

    @Post('mark-all-absent')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Mark all active users as absent for a specific date' })
    @ApiResponse({ status: 201, description: 'All users marked as absent successfully' })
    async markAllUsersAbsent(
        @Body('date') date: Date,
        @Body('eventType') eventType: AttendanceEventType
    ) {
        await this.attendanceService.markAllUsersAbsent(date, eventType);
        return { message: 'All users marked as absent successfully' };
    }

    @Post('mark')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update attendance status for a user (must be marked absent first)' })
    @ApiResponse({ status: 201, description: 'Attendance status updated successfully' })
    @ApiResponse({ status: 404, description: 'No attendance record found for this user and date' })
    async markAttendance(@Body() createAttendanceDto: CreateAttendanceDto) {
        return this.attendanceService.markAttendance(createAttendanceDto);
    }

    @Patch(':id/justify')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
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
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get attendance statistics for a specific user' })
    async getUserStats(
        @Param('userId', ParseIntPipe) userId: number,
        @Query('startDate') startDate: Date,
        @Query('endDate') endDate: Date
    ) {
        return this.attendanceService.getUserAttendanceStats(userId, startDate, endDate);
    }

    @Get('stats/overall')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get overall attendance statistics' })
    async getOverallStats(
        @Query('startDate') startDate: Date,
        @Query('endDate') endDate: Date
    ) {
        return this.attendanceService.getAttendanceStats(startDate, endDate);
    }

    @Post('mark-remaining-absent')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Mark remaining unmarked users as absent for a specific date' })
    @ApiResponse({ status: 201, description: 'Remaining users marked as absent successfully' })
    async markRemainingUsersAbsent(
        @Body('date') date: Date,
        @Body('eventType') eventType: AttendanceEventType
    ) {
        await this.attendanceService.markRemainingUsersAbsent(date, eventType);
        return { message: 'Remaining users marked as absent successfully' };
    }

    @Post('manual')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Manually mark attendance for a user' })
    @ApiResponse({ status: 201, description: 'Attendance marked successfully' })
    async markManualAttendance(@Body() createAttendanceDto: CreateAttendanceDto) {
        return this.attendanceService.markAttendance(createAttendanceDto);
    }

    @Post('initialize')
    @Roles(AdminRole.ATTENDANCE_ADMIN, AdminRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Initialize attendance records for all active users' })
    @ApiResponse({ status: 201, description: 'Attendance records initialized successfully' })
    async initializeAttendance(
        @Body('date') date: Date | string,
        @Body('eventType') eventType: AttendanceEventType,
        @Body('status') status: AttendanceStatus = AttendanceStatus.ABSENT
    ) {
        return this.attendanceService.initializeAttendance(date, eventType, status);
    }
}
