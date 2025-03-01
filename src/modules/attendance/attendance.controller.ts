import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Param, 
    Put, 
    BadRequestException,
    NotFoundException,
    ValidationPipe,
    UsePipes,
    ParseIntPipe,
    Query,
    DefaultValuePipe,
} from '@nestjs/common';
import { API_ROUTES } from '../../common/routes/api.routes';
import { AttendanceService } from './attendance.service';
import { Attendance } from './attendance.entity';
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
@Controller()
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) {}

    @ApiOperation({ summary: 'Get all attendance records with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
    @ApiResponse({ status: 200, description: 'Returns paginated attendance records' })
    @Get(API_ROUTES.ATTENDANCE.BASE)
    async getAllAttendance(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('search') search?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ) {
        return this.attendanceService.findAll({ page, limit, search, sortBy, sortOrder });
    }

    @Get(API_ROUTES.ATTENDANCE.BY_ID)
    async getAttendanceById(@Param('id', ParseIntPipe) id: number): Promise<Attendance> {
        const attendance = await this.attendanceService.findOne(id);
        if (!attendance) {
            throw new NotFoundException(`Attendance with ID ${id} not found`);
        }
        return attendance;
    }

    @Get(API_ROUTES.ATTENDANCE.BY_USER)
    async getUserAttendance(
        @Param('userId', ParseIntPipe) userId: number,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
    ) {
        return this.attendanceService.findByUser(userId, { page, limit, sortBy, sortOrder });
    }

    @ApiOperation({ summary: 'Mark attendance for a user at an event' })
    @ApiResponse({ status: 201, description: 'Attendance marked successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 403, description: 'User not allowed to attend this event' })
    @Post(API_ROUTES.ATTENDANCE.MARK)
    @UsePipes(new ValidationPipe({ transform: true }))
    async markAttendance(
        @Body('userId', ParseIntPipe) userId: number,
        @Body('eventId', ParseIntPipe) eventId: number
    ): Promise<Attendance> {
        return this.attendanceService.markAttendance(userId, eventId);
    }

    @Put(API_ROUTES.ATTENDANCE.JUSTIFY)
    async justifyAbsence(
        @Param('id', ParseIntPipe) id: number,
        @Body('justified') justified: boolean
    ): Promise<Attendance> {
        return this.attendanceService.justifyAbsence(id, justified);
    }

    @Get('stats')
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ 
        name: 'groupBy', 
        enum: ['week', 'month', 'year'], 
        required: false,
        default: 'month' 
    })
    @ApiQuery({ 
        name: 'preset', 
        required: false,
        enum: ['current_week', 'current_month', 'current_year', 'last_3_months', 'last_year'],
        description: 'Use preset date ranges instead of specific dates'
    })
    async getAttendanceStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('groupBy') groupBy: 'week' | 'month' | 'year' = 'month',
        @Query('preset') preset?: 'current_week' | 'current_month' | 'current_year' | 'last_3_months' | 'last_year',
    ) {
        try {
            return await this.attendanceService.getAttendanceStats(
                startDate ? new Date(startDate) : undefined,
                endDate ? new Date(endDate) : undefined,
                groupBy,
                preset
            );
        } catch (error) {
            console.error('Stats error:', error);
            throw new BadRequestException('Error while fetching attendance stats');
        }
    }
}
