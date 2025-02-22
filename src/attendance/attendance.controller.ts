import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AttendanceService } from './attendance.service';
import { LeaveService } from '../leave/leave.service';
import { AttendanceStatus } from './attendance.entity';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly userService: UsersService,
    private readonly leaveService: LeaveService,
  ) {}

  // ✅ Get attendance for a specific user
  @Get(':userId')
  async getUserAttendance(@Param('userId') userId: string) {
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      const attendance = await this.attendanceService.getAttendanceByUserId(id);
      return { success: true, data: attendance };
    } catch (error) {
      console.error('Error fetching user attendance:', error);
      throw new InternalServerErrorException('Failed to fetch attendance');
    }
  }

  // ✅ Get all attendance records
  @Get()
  async getAllAttendance() {
    try {
      const attendance = await this.attendanceService.getAllAttendance();
      return { success: true, data: attendance };
    } catch (error) {
      console.error('Error fetching all attendance:', error);
      throw new InternalServerErrorException('Failed to fetch attendance records');
    }
  }

  // ✅ Mark attendance (with leave check)
  @Post('mark')
  async markAttendance(
    @Body() body: { userId: number; status: AttendanceStatus; dateTime?: string },
  ) {
    const { userId, status, dateTime } = body;

    // Validate input
    if (!userId || !Object.values(AttendanceStatus).includes(status)) {
      throw new BadRequestException('Invalid user ID or attendance status');
    }

    try {
      const user = await this.userService.getOneUser(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const currentDate = new Date(dateTime || new Date()).toISOString().split('T')[0];

      // Check if the user is on leave
      const leaves = await this.leaveService.getLeavesByUserId(userId);
      const isOnLeave = leaves.some((leave) => {
        const leaveStart = new Date(leave.startDate).toISOString().split('T')[0];
        const leaveEnd = leave.endDate
          ? new Date(leave.endDate).toISOString().split('T')[0]
          : leaveStart;
        return currentDate >= leaveStart && currentDate <= leaveEnd;
      });

      // Skip attendance marking if the user is on leave
      if (isOnLeave) {
        console.log(`Skipping attendance for user ${userId} as they are on leave.`);
        return { success: true, message: 'User is on leave, attendance not marked' };
      }

      // Mark attendance if not on leave
      const attendance = await this.attendanceService.markAttendance(userId, status);
      return { success: true, data: attendance };
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw new InternalServerErrorException('Failed to mark attendance');
    }
  }

  // ✅ Get today's attendance for all users
  @Get('today')
  async getTodayAttendance() {
    try {
      const attendance = await this.attendanceService.getTodayAttendance();
      return { success: true, data: attendance };
    } catch (error) {
      console.error('Error fetching today’s attendance:', error);
      throw new InternalServerErrorException('Failed to fetch today’s attendance');
    }
  }

  // ✅ Get attendance counts for a specific day
@Get('count/:date')
async getAttendanceCountByDate(@Param('date') date: string) {
  try {
    const count = await this.attendanceService.getAttendanceCountByDate(date);
    return { success: true, data: count };
  } catch (error) {
    console.error('Error fetching attendance count:', error);
    throw new InternalServerErrorException('Failed to fetch attendance count');
  }
}
}
