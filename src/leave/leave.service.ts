import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leave } from './leave.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(Leave)
    private leaveRepository: Repository<Leave>,
    private userService: UsersService,
  ) {}

  async recordLeave(
    userId: number,
    startDate: string,
    endDate: string | null,
    leaveType: string,
  ) {
    const user = await this.userService.getUserWithAttendanceAndLeaves(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const overlappingLeave = await this.leaveRepository.findOne({
      where: {
        user: { id: userId },
        startDate,
        endDate,
      },
    });

    if (overlappingLeave) {
      throw new BadRequestException('User already has a leave during this period.');
    }

    const leave = this.leaveRepository.create({
      startDate,
      endDate,
      leaveType,
      user,
    });

    await this.leaveRepository.save(leave);
    return leave;
  }

  async getLeavesByUserId(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    return await this.leaveRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async getAllLeaves() {
    return await this.leaveRepository.find({ relations: ['user'] });
  }

  async updateLeave(leaveId: number, updateData: Partial<Leave>) {
    await this.leaveRepository.update(leaveId, updateData);
    return await this.leaveRepository.findOne({ where: { id: leaveId }, relations: ['user'] });
  }

  async cancelLeave(leaveId: number) {
    const leave = await this.leaveRepository.findOne({ where: { id: leaveId } });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    await this.leaveRepository.remove(leave);
  }

  async getActiveLeaves() {
    return await this.leaveRepository.find({
      where: { startDate: new Date().toISOString().split('T')[0]},
      relations: ['user'],
    });
  }
}