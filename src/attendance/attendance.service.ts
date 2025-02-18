import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Attendance } from "./attendance.entity";
import { Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { WebAuthnService } from "../webauthn/webauthn.service";

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,

    private readonly usersService: UsersService,
    @Inject(forwardRef(() => WebAuthnService)) // Inject UsersService
    private readonly webAuthnService: WebAuthnService, // Inject WebAuthnService
  ) {}

  async getAttendanceByUserId(userId: number): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { user: { id: userId } },
    });
  }

  async getAllAttendance(): Promise<Attendance[]> {
    // Fetch all attendance records from the database
    return this.attendanceRepository.find({
      relations: ['user'], // Make sure to load the related user data as well
    });
  }

  async markAttendance(userId: number, credential: any): Promise<Attendance> {
    // Retrieve the user by ID
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
  
    // Verify the WebAuthn credential using the WebAuthn service
    const verificationResult = await this.webAuthnService.verifyAttendance(userId, credential);
    if (!verificationResult.success) {
      throw new Error('Fingerprint mismatch or authentication failed');
    }
  
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  
    // Check if the user has already marked attendance for today
    const existingAttendance = await this.attendanceRepository.findOne({
      where: { user: { id: user.id }, date: today },
    });
  
    if (existingAttendance) {
      throw new Error('Attendance already marked for today.');
    }
  
    // Create a new attendance record
    const attendance = this.attendanceRepository.create({
      user, // Assign the full User object, not just the ID
      date: today, // Store the date of attendance
      dateTime: new Date().toISOString().split('T')[1].split('.')[0], // Store the exact time of attendance (without milliseconds)
      attended: true, // Set attendance status to true
    });
  
    // Save the new attendance record to the database
    return this.attendanceRepository.save(attendance);
  }
  
}
