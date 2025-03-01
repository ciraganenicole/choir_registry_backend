import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLeaveDto, UpdateLeaveDto } from '../../common/dtos/leave.dto';
import { Leave } from './leave.entity';
import { UsersService } from '../users';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<Leave[]> {
    return this.leaveRepository.find({ relations: ['user'] });
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
      relations: ['user']
    });
  }

  async create(leaveData: CreateLeaveDto): Promise<Leave> {
    const user = await this.usersService.findById(leaveData.userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${leaveData.userId} not found`);
    }

    const leave = this.leaveRepository.create({
      ...leaveData,
      user
    });

    return this.leaveRepository.save(leave);
  }

  async update(id: number, leaveData: UpdateLeaveDto): Promise<Leave> {
    await this.leaveRepository.update(id, leaveData);
    return this.findOne(id);
  }

  async approve(id: number): Promise<Leave> {
    const leave = await this.findOne(id);
    leave.approved = true;
    leave.rejected = false;
    return this.leaveRepository.save(leave);
  }

  async reject(id: number): Promise<Leave> {
    const leave = await this.findOne(id);
    leave.rejected = true;
    leave.approved = false;
    return this.leaveRepository.save(leave);
  }

  async remove(id: number): Promise<void> {
    const result = await this.leaveRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Leave with ID ${id} not found`);
    }
  }
} 