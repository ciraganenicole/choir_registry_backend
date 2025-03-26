import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leave } from './leave.entity';
import { UsersService } from '../users/users.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<Leave[]> {
    return this.leaveRepository.find({
      relations: ['user'],
      order: { startDate: 'DESC' }
    });
  }

  async create(createLeaveDto: CreateLeaveDto): Promise<Leave> {
    const { userId, startDate, endDate, reason } = createLeaveDto;

    // Get user
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if dates are valid
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check for overlapping leaves
    const overlappingLeave = await this.leaveRepository.findOne({
      where: {
        user: { id: userId },
        startDate: LessThanOrEqual(endDate),
        endDate: MoreThanOrEqual(startDate),
      },
    });

    if (overlappingLeave) {
      throw new BadRequestException('Leave period overlaps with existing leave');
    }

    const leave = this.leaveRepository.create({
      user,
      startDate,
      endDate,
      reason,
    });

    return this.leaveRepository.save(leave);
  }

  async update(id: number, updateLeaveDto: CreateLeaveDto): Promise<Leave> {
    const leave = await this.findOne(id);

    if (updateLeaveDto.startDate && updateLeaveDto.endDate) {
      if (updateLeaveDto.startDate > updateLeaveDto.endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      // Check for overlapping leaves
      const overlappingLeave = await this.leaveRepository.findOne({
        where: {
          user: { id: leave.user.id },
          id: Not(id),
          startDate: LessThanOrEqual(updateLeaveDto.endDate),
          endDate: MoreThanOrEqual(updateLeaveDto.startDate),
        },
      });

      if (overlappingLeave) {
        throw new BadRequestException('Leave period overlaps with existing leave');
      }
    }

    Object.assign(leave, updateLeaveDto);
    return this.leaveRepository.save(leave);
  }

  async findOne(id: number): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['user']
    });
    if (!leave) {
      throw new NotFoundException(`Leave with ID ${id} not found`);
    }
    return leave;
  }

  async findByUser(userId: number): Promise<Leave[]> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.leaveRepository.find({
      where: { user: { id: userId } },
      order: { startDate: 'DESC' }
    });
  }

  async remove(id: number): Promise<void> {
    const leave = await this.findOne(id);
    await this.leaveRepository.remove(leave);
  }

  async isUserOnLeave(userId: number, date: Date): Promise<boolean> {
    const leave = await this.leaveRepository.findOne({
      where: {
        user: { id: userId },
        startDate: LessThanOrEqual(date),
        endDate: MoreThanOrEqual(date),
      }
    });
    return !!leave;
  }
} 