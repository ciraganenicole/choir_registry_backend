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
    create(@Body() createAttendanceDto: CreateAttendanceDto) {
        return this.attendanceService.create(createAttendanceDto);
    }

    @Get()
    findAll(@Query() filterDto: AttendanceFilterDto) {
        return this.attendanceService.findAll(filterDto);
    }

    @Get('user/:userId')
    findByUser(
        @Param('userId', ParseIntPipe) userId: number,
        @Query() filterDto: AttendanceFilterDto
    ) {
        return this.attendanceService.findByUser(userId, filterDto);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.attendanceService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateAttendanceDto: UpdateAttendanceDto
    ) {
        return this.attendanceService.update(id, updateAttendanceDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.attendanceService.remove(id);
    }

    @Post('manual')
    markManualAttendance(@Body() createAttendanceDto: CreateAttendanceDto) {
        return this.attendanceService.markManualAttendance(createAttendanceDto);
    }

    @Patch(':id/justify')
    justifyAbsence(
        @Param('id', ParseIntPipe) id: number,
        @Body('justified') justified: boolean
    ) {
        return this.attendanceService.justifyAbsence(id, justified);
    }

    @Get('stats/user/:userId')
    async getUserStats(
        @Param('userId', ParseIntPipe) userId: number,
        @Query('startDate') startDate: Date,
        @Query('endDate') endDate: Date
    ) {
        return this.attendanceService.getUserAttendanceStats(userId, startDate, endDate);
    }

    @Get('stats/overall')
    async getOverallStats(
        @Query('startDate') startDate: Date,
        @Query('endDate') endDate: Date
    ) {
        return this.attendanceService.getAttendanceStats(startDate, endDate);
    }
}
