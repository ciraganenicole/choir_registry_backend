import { Controller, Post, Body, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JustificationService } from './justification.service';

@Controller('justification')
export class JustificationController {
  constructor(private justificationService: JustificationService) {}

  // Add justification for a late or absent user
  @Post()
  async addJustification(
    @Body() body: { attendanceId: number; reason: string; type: 'late' | 'absent' }
  ) {
    const { attendanceId, reason, type } = body;

    if (!attendanceId || !reason || !type) {
      throw new BadRequestException("Attendance ID, reason, and type are required");
    }

    try {
      const justification = await this.justificationService.addJustification(attendanceId, reason, type);
      return { success: true, data: justification };
    } catch (error) {
      console.error("Error adding justification:", error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
