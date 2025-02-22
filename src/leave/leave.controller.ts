import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  BadRequestException,
  InternalServerErrorException,
  Patch,
  Delete,
} from '@nestjs/common';
import { LeaveService } from './leave.service';

@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  // ✅ Request a leave
  @Post('record')
  async recordLeave(
    @Body() body: { userId: number; startDate: string; endDate?: string; leaveType: string },
  ) {
    const { userId, startDate, endDate, leaveType } = body;

    if (!userId || !startDate || !leaveType) {
      throw new BadRequestException('User ID, start date, and leave type are required.');
    }

    try {
      const leave = await this.leaveService.recordLeave(userId, startDate, endDate || null, leaveType);
      return { success: true, message: 'Leave recorded successfully', data: leave };
    } catch (error) {
      console.error('Error recording leave:', error);
      throw new InternalServerErrorException('Failed to record leave');
    }
  }

  // ✅ Get leave requests for a specific user
  @Get(':userId')
  async getUserLeaves(@Param('userId') userId: string) {
    const id = parseInt(userId, 10);
    if (isNaN(id)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      const leaves = await this.leaveService.getLeavesByUserId(id);
      return { success: true, data: leaves };
    } catch (error) {
      console.error('Error fetching user leaves:', error);
      throw new InternalServerErrorException('Failed to fetch user leaves');
    }
  }

  // ✅ Get all leave requests (Admin View)
  @Get()
  async getAllLeaves() {
    try {
      const leaves = await this.leaveService.getAllLeaves();
      return { success: true, data: leaves };
    } catch (error) {
      console.error('Error fetching all leaves:', error);
      throw new InternalServerErrorException('Failed to fetch leave records');
    }
  }

  // ✅ Update a leave request
  @Patch(':leaveId')
  async updateLeave(
    @Param('leaveId') leaveId: string,
    @Body() body: { startDate?: string; endDate?: string; leaveType?: string },
  ) {
    const id = parseInt(leaveId, 10);
    if (isNaN(id)) {
      throw new BadRequestException('Invalid leave ID');
    }

    if (!body.startDate && !body.endDate && !body.leaveType) {
      throw new BadRequestException('At least one field to update must be provided.');
    }

    try {
      const updatedLeave = await this.leaveService.updateLeave(id, body);
      return { success: true, message: 'Leave updated successfully', data: updatedLeave };
    } catch (error) {
      console.error('Error updating leave:', error);
      throw new InternalServerErrorException('Failed to update leave record');
    }
  }

  // ✅ Cancel a leave request (Only if ongoing or future)
  @Delete(':leaveId')
  async cancelLeave(@Param('leaveId') leaveId: string) {
    const id = parseInt(leaveId, 10);
    if (isNaN(id)) {
      throw new BadRequestException('Invalid leave ID');
    }

    try {
      await this.leaveService.cancelLeave(id);
      return { success: true };
    } catch (error) {
      console.error('Error canceling leave:', error);
      throw new InternalServerErrorException('Failed to cancel leave request');
    }
  }

  // ✅ Get active leaves (Ongoing or Future)
  @Get('active')
  async getActiveLeaves() {
    try {
      const activeLeaves = await this.leaveService.getActiveLeaves();
      return { success: true, data: activeLeaves };
    } catch (error) {
      console.error('Error fetching active leaves:', error);
      throw new InternalServerErrorException('Failed to fetch active leave records');
    }
  }
}