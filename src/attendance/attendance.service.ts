import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from './attendance.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly usersService: UsersService,
  ) {}

  async getAttendanceByUserId(userId: number): Promise<Attendance[]> {
    const user = await this.usersService.getUserWithAttendanceAndLeaves(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user.attendance;
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return this.attendanceRepository.find({ relations: ['user'] });
  }

  async getTodayAttendance(): Promise<Attendance[]> {
    const today = new Date().toISOString().split('T')[0]; // Normalizing the date (without time)
    return this.attendanceRepository.find({
      where: { date: today },
      relations: ['user'],
    });
  }

  async markAttendance(userId: number, status: AttendanceStatus): Promise<any> {
    const user = await this.usersService.getUserWithAttendanceAndLeaves(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Get today's date based on local time (not UTC)
    const today = new Date();
const todayString = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
const currentTime = today.toTimeString().split(' ')[0];  // HH:MM:SS format

    // Log today's date and attendance entries for debugging
    console.log(`Checking attendance for user ${userId} on ${todayString}`);
    user.attendance.forEach(att => console.log(`Attendance date: ${att.date}`));

    // Ensure date format consistency in the attendance records
    const existingAttendance = user.attendance.find(
      (attendance) => attendance.date === todayString,
    );

    if (existingAttendance) {
      console.log('Attendance already marked for today');
      throw new Error('Attendance already marked for today.');
    }

    // Check if the user is on leave (but don't mark them as ON_LEAVE)
    const isOnLeave = user.leaves.some((leave) => {
      const leaveStart = new Date(leave.startDate).toLocaleDateString('en-CA');
      const leaveEnd = leave.endDate
        ? new Date(leave.endDate).toLocaleDateString('en-CA')
        : leaveStart;
      return todayString >= leaveStart && todayString <= leaveEnd;
    });

    // If the user is on leave, skip marking attendance
    if (isOnLeave) {
      console.log(`Skipping attendance for user ${userId} as they are on leave.`);
      return { success: true, message: 'User is on leave, attendance not marked' };
    }

    // Mark attendance for users not on leave
    const attendance = this.attendanceRepository.create({
      user,
      date: todayString,
      dateTime: currentTime,
      status,
      justified: status === AttendanceStatus.LATE && Math.random() < 0.5,
    });

    await this.attendanceRepository.save(attendance);
    return { success: true, data: attendance };
  }

  async getAttendanceCountByDate(date: string): Promise<any> {
    const attendanceRecords = await this.attendanceRepository.find({
      where: { date },
      relations: ['user'],
    });

    const count = {
      present: 0,
      late: 0,
      absent: 0,
    };

    // Count each attendance status
    attendanceRecords.forEach((attendance) => {
      if (attendance.status === AttendanceStatus.PRESENT) {
        count.present++;
      } else if (attendance.status === AttendanceStatus.LATE) {
        count.late++;
      } else if (attendance.status === AttendanceStatus.ABSENT) {
        count.absent++;
      }
    });

    return count;
  }
}
