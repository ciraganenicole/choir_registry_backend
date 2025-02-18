import { Controller, Post, Body, Get, Param, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AttendanceService } from './attendance.service';
import { WebAuthnService } from '../webauthn/webauthn.service';  // Import WebAuthnService
import { Attendance } from './attendance.entity';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private attendanceService: AttendanceService,
    private userService: UsersService,
    private webAuthnService: WebAuthnService,  // Inject WebAuthnService
  ) {}

  @Get(':userId')
  async getOneAttendance(@Param('userId') userId: number) {
    return await this.attendanceService.getAttendanceByUserId(userId);
  }

  @Get()
  async getAttendance() {
    return await this.attendanceService.getAllAttendance();
  }
  
  @Post('mark')
  async markAttendance(@Body() body: { userId: number; credential: any }) {
    const { userId, credential } = body;

    if (!userId || !credential) {
      console.log("Invalid request body:", body);  // Log incoming body
      throw new BadRequestException("User ID or credential missing");
    }

    try {
      // Call WebAuthnService to verify the attendance
      const attendanceVerified = await this.webAuthnService.verifyAttendance(userId, credential);
      
      // If everything is good, mark attendance in the database
      return { success: true, data: attendanceVerified };
    } catch (error) {
      console.error("Error in marking attendance:", error);
      throw new InternalServerErrorException("Failed to mark attendance");
    }
  }
}
