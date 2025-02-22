import { forwardRef, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Justification } from "./justification.entity";
import { AttendanceService } from "../attendance/attendance.service";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class JustificationService {
    constructor(
        @InjectRepository(Justification)
        private justificationRepository: Repository<Justification>,
        @Inject(forwardRef(() => AttendanceService))
        
        private attendanceService: AttendanceService, // Ensure this is correctly imported and injected
      ) {}

  // Add a justification for an attendance record
  async addJustification(attendanceId: number, reason: string, type: 'late' | 'absent') {
    try {
      // Check if the attendance exists (fetch single record)
      const attendance = await this.attendanceService.getAttendanceByUserId(attendanceId);
      if (!attendance) {
        throw new Error('Attendance record not found');
      }

      // Create and save justification
      const justification = this.justificationRepository.create({
        // attendance: attendance[0],  // Ensure this is a single attendance record (get first element of array)
        // reason,
        // type,
        date: new Date().toISOString().split('T')[0], // Current date
      });

      await this.justificationRepository.save(justification);
      return justification;
    } catch (error) {
      console.error('Error adding justification:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  // Get justification for a specific user on a specific date
  async getJustificationByUserId(userId: number, date: string): Promise<Justification | null> {
    return this.justificationRepository.findOne({
    //   where: {
    //     date,
    //     attendance: {
    //       user: {
    //         id: userId,  // Filter by user id through attendance relation
    //       }
    //     }
    //   },
      relations: ['attendance', 'attendance.user'],  // Ensure relations are included
    });
  }
}
