import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { LeadershipShift, ShiftStatus } from './leadership-shift.entity';
import { User } from '../users/user.entity';
import { UserCategory } from '../users/enums/user-category.enum';
import { CreateLeadershipShiftDto } from './dto/create-leadership-shift.dto';
import { UpdateLeadershipShiftDto } from './dto/update-leadership-shift.dto';
import { LeadershipShiftFilterDto } from './dto/leadership-shift-filter.dto';

export interface LeadershipShiftStats {
  totalShifts: number;
  activeShifts: number;
  upcomingShifts: number;
  completedShifts: number;
  currentLeader?: {
    id: number;
    name: string;
    email: string;
  };
  nextTransitionDays?: number;
  activeLeaders: number;
  byStatus: Record<ShiftStatus, number>;
  byMonth: Record<string, number>;
}

export interface LeaderHistory {
  leaderId: number;
  leaderName: string;
  leaderEmail: string;
  totalEvents: number;
  totalEventsCompleted: number;
}

@Injectable()
export class LeadershipShiftService {
  constructor(
    @InjectRepository(LeadershipShift)
    private readonly leadershipShiftRepository: Repository<LeadershipShift>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createLeadershipShiftDto: CreateLeadershipShiftDto, userId: number): Promise<LeadershipShift> {
    // Verify leader exists and has LEAD category
    const leader = await this.userRepository.findOneBy({ id: createLeadershipShiftDto.leaderId });
    if (!leader) {
      throw new NotFoundException(`Leader with ID ${createLeadershipShiftDto.leaderId} not found`);
    }

    // Check if leader has LEAD category
    if (!leader.categories?.includes(UserCategory.LEAD)) {
      throw new BadRequestException(`User ${leader.firstName} ${leader.lastName} does not have LEAD category`);
    }

    // Check for date conflicts
    const startDate = new Date(createLeadershipShiftDto.startDate);
    const endDate = new Date(createLeadershipShiftDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check for overlapping shifts for the same leader
    const overlappingShift = await this.leadershipShiftRepository
      .createQueryBuilder('shift')
      .where('shift.leaderId = :leaderId', { leaderId: createLeadershipShiftDto.leaderId })
      .andWhere('shift.status IN (:...statuses)', { statuses: [ShiftStatus.ACTIVE, ShiftStatus.UPCOMING] })
      .andWhere(
        '(shift.startDate BETWEEN :startDate AND :endDate OR shift.endDate BETWEEN :startDate AND :endDate OR (shift.startDate <= :startDate AND shift.endDate >= :endDate))',
        { startDate, endDate }
      )
      .getOne();

    if (overlappingShift) {
      throw new ConflictException('Leader already has a shift during this period');
    }

    // CRITICAL: Check if there's already an active shift that would overlap with this new shift
    // This prevents having multiple active shifts at the same time
    const conflictingActiveShift = await this.leadershipShiftRepository
      .createQueryBuilder('shift')
      .where('shift.status = :status', { status: ShiftStatus.ACTIVE })
      .andWhere(
        '(shift.startDate BETWEEN :startDate AND :endDate OR shift.endDate BETWEEN :startDate AND :endDate OR (shift.startDate <= :startDate AND shift.endDate >= :endDate))',
        { startDate, endDate }
      )
      .getOne();

    if (conflictingActiveShift) {
      throw new ConflictException(
        `Cannot create shift from ${startDate.toDateString()} to ${endDate.toDateString()}. ` +
        `There is already an active shift from ${conflictingActiveShift.startDate.toDateString()} to ${conflictingActiveShift.endDate.toDateString()} ` +
        `led by ${conflictingActiveShift.leader.firstName} ${conflictingActiveShift.leader.lastName}. ` +
        `Only one shift can be active at a time.`
      );
    }

    // If this is an ACTIVE shift, deactivate other active shifts
    if (createLeadershipShiftDto.status === ShiftStatus.ACTIVE) {
      await this.leadershipShiftRepository.update(
        { status: ShiftStatus.ACTIVE },
        { status: ShiftStatus.COMPLETED }
      );
    }

    const shift = this.leadershipShiftRepository.create({
      ...createLeadershipShiftDto,
      startDate,
      endDate,
      // Don't set createdById for admin users since they use UUIDs
      // createdById: userId,
    });

    return this.leadershipShiftRepository.save(shift);
  }

  async findAll(filterDto: LeadershipShiftFilterDto): Promise<[LeadershipShift[], number]> {
    const queryBuilder = this.leadershipShiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.leader', 'leader')
      .leftJoinAndSelect('shift.created_by', 'created_by');

    // Apply filters
    if (filterDto.search) {
      queryBuilder.andWhere(
        '(shift.name ILIKE :search OR leader.firstName ILIKE :search OR leader.lastName ILIKE :search OR leader.email ILIKE :search)',
        { search: `%${filterDto.search}%` }
      );
    }

    if (filterDto.status) {
      queryBuilder.andWhere('shift.status = :status', { status: filterDto.status });
    }

    if (filterDto.leaderId) {
      queryBuilder.andWhere('shift.leaderId = :leaderId', { leaderId: filterDto.leaderId });
    }

    if (filterDto.startDate) {
      queryBuilder.andWhere('shift.startDate >= :startDate', { startDate: filterDto.startDate });
    }

    if (filterDto.endDate) {
      queryBuilder.andWhere('shift.endDate <= :endDate', { endDate: filterDto.endDate });
    }

    // Order by start date (newest first)
    queryBuilder.orderBy('shift.startDate', 'DESC');

    // Apply pagination
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 10;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async findOne(id: number): Promise<LeadershipShift> {
    const shift = await this.leadershipShiftRepository.findOne({
      where: { id },
      relations: ['leader', 'created_by'],
    });

    if (!shift) {
      throw new NotFoundException(`Leadership shift with ID ${id} not found`);
    }

    return shift;
  }

  async update(id: number, updateLeadershipShiftDto: UpdateLeadershipShiftDto, userId: number): Promise<LeadershipShift> {
    const shift = await this.findOne(id);

    // Verify leader exists if being updated
    if (updateLeadershipShiftDto.leaderId) {
      const leader = await this.userRepository.findOneBy({ id: updateLeadershipShiftDto.leaderId });
      if (!leader) {
        throw new NotFoundException(`Leader with ID ${updateLeadershipShiftDto.leaderId} not found`);
      }

      if (!leader.categories?.includes(UserCategory.LEAD)) {
        throw new BadRequestException(`User ${leader.firstName} ${leader.lastName} does not have LEAD category`);
      }
    }

    // Check for date conflicts if dates are being updated
    if (updateLeadershipShiftDto.startDate || updateLeadershipShiftDto.endDate) {
      const startDate = updateLeadershipShiftDto.startDate ? new Date(updateLeadershipShiftDto.startDate) : shift.startDate;
      const endDate = updateLeadershipShiftDto.endDate ? new Date(updateLeadershipShiftDto.endDate) : shift.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      // Check for overlapping shifts (excluding current shift)
      const overlappingShift = await this.leadershipShiftRepository
        .createQueryBuilder('shift')
        .where('shift.leaderId = :leaderId', { leaderId: updateLeadershipShiftDto.leaderId || shift.leaderId })
        .andWhere('shift.status IN (:...statuses)', { statuses: [ShiftStatus.ACTIVE, ShiftStatus.UPCOMING] })
        .andWhere('shift.id != :id', { id })
        .andWhere(
          '(shift.startDate BETWEEN :startDate AND :endDate OR shift.endDate BETWEEN :startDate AND :endDate OR (shift.startDate <= :startDate AND shift.endDate >= :endDate))',
          { startDate, endDate }
        )
        .getOne();

      if (overlappingShift) {
        throw new ConflictException('Leader already has a shift during this period');
      }

      // CRITICAL: Check if there's already an active shift that would overlap with this updated shift
      // This prevents having multiple active shifts at the same time
      const conflictingActiveShift = await this.leadershipShiftRepository
        .createQueryBuilder('shift')
        .where('shift.status = :status', { status: ShiftStatus.ACTIVE })
        .andWhere('shift.id != :id', { id })
        .andWhere(
          '(shift.startDate BETWEEN :startDate AND :endDate OR shift.endDate BETWEEN :startDate AND :endDate OR (shift.startDate <= :startDate AND shift.endDate >= :endDate))',
          { startDate, endDate }
        )
        .getOne();

      if (conflictingActiveShift) {
        throw new ConflictException(
          `Cannot update shift to ${startDate.toDateString()} to ${endDate.toDateString()}. ` +
          `There is already an active shift from ${conflictingActiveShift.startDate.toDateString()} to ${conflictingActiveShift.endDate.toDateString()} ` +
          `led by ${conflictingActiveShift.leader.firstName} ${conflictingActiveShift.leader.lastName}. ` +
          `Only one shift can be active at a time.`
        );
      }
    }

    // If status is being changed to ACTIVE, deactivate other active shifts
    if (updateLeadershipShiftDto.status === ShiftStatus.ACTIVE && shift.status !== ShiftStatus.ACTIVE) {
      await this.leadershipShiftRepository.update(
        { status: ShiftStatus.ACTIVE },
        { status: ShiftStatus.COMPLETED }
      );
    }

    // Update the shift
    Object.assign(shift, updateLeadershipShiftDto);
    
    if (updateLeadershipShiftDto.startDate) {
      shift.startDate = new Date(updateLeadershipShiftDto.startDate);
    }
    if (updateLeadershipShiftDto.endDate) {
      shift.endDate = new Date(updateLeadershipShiftDto.endDate);
    }

    return this.leadershipShiftRepository.save(shift);
  }

  async remove(id: number, userId: number): Promise<void> {
    const shift = await this.findOne(id);
    await this.leadershipShiftRepository.remove(shift);
  }

  async getStats(): Promise<LeadershipShiftStats> {
    // First update statuses to ensure accuracy
    await this.updateShiftStatuses();
    
    const now = new Date();
    const currentYear = now.getFullYear();

    // Get current active shift
    const currentShift = await this.leadershipShiftRepository.findOne({
      where: { status: ShiftStatus.ACTIVE },
      relations: ['leader'],
    });

    // Calculate next transition days
    let nextTransitionDays: number | undefined;
    if (currentShift) {
      const daysUntilEnd = Math.ceil((currentShift.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      nextTransitionDays = Math.max(0, daysUntilEnd);
    }

    // Get counts by status
    const [totalShifts, activeShifts, upcomingShifts, completedShifts] = await Promise.all([
      this.leadershipShiftRepository.count(),
      this.leadershipShiftRepository.count({ where: { status: ShiftStatus.ACTIVE } }),
      this.leadershipShiftRepository.count({ where: { status: ShiftStatus.UPCOMING } }),
      this.leadershipShiftRepository.count({ where: { status: ShiftStatus.COMPLETED } }),
    ]);

    // Count active leaders (users with LEAD category)
    const activeLeaders = await this.userRepository.count({
      where: { categories: In([UserCategory.LEAD]) },
    });

    // Get stats by status
    const byStatus = {
      [ShiftStatus.ACTIVE]: activeShifts,
      [ShiftStatus.UPCOMING]: upcomingShifts,
      [ShiftStatus.COMPLETED]: completedShifts,
      [ShiftStatus.CANCELLED]: totalShifts - activeShifts - upcomingShifts - completedShifts,
    };

    // Get stats by month for current year
    const monthlyStats = await this.leadershipShiftRepository
      .createQueryBuilder('shift')
      .select('EXTRACT(MONTH FROM shift.startDate)', 'month')
      .addSelect('COUNT(*)', 'count')
      .where('EXTRACT(YEAR FROM shift.startDate) = :year', { year: currentYear })
      .groupBy('month')
      .getRawMany();

    const byMonth: Record<string, number> = {};
    monthlyStats.forEach(stat => {
      const monthName = new Date(currentYear, parseInt(stat.month) - 1).toLocaleString('default', { month: 'long' });
      byMonth[monthName] = parseInt(stat.count);
    });

    return {
      totalShifts,
      activeShifts,
      upcomingShifts,
      completedShifts,
      currentLeader: currentShift ? {
        id: currentShift.leader.id,
        name: `${currentShift.leader.firstName} ${currentShift.leader.lastName}`,
        email: currentShift.leader.email,
      } : undefined,
      nextTransitionDays,
      activeLeaders,
      byStatus,
      byMonth,
    };
  }

  async getLeaderHistory(): Promise<LeaderHistory[]> {
    try {
      // First check if there are any leadership shifts
      const shiftCount = await this.leadershipShiftRepository.count();
      if (shiftCount === 0) {
        return [];
      }

             const results = await this.leadershipShiftRepository
         .createQueryBuilder('shift')
         .leftJoin('shift.leader', 'leader')
         .select('leader.id', 'leaderId')
         .addSelect("CONCAT(leader.firstName, ' ', leader.lastName)", 'leaderName')
         .addSelect('leader.email', 'leaderEmail')
         .addSelect('COALESCE(SUM(shift.eventsScheduled), 0)', 'totalEvents')
         .addSelect('COALESCE(SUM(shift.eventsCompleted), 0)', 'totalEventsCompleted')
         .groupBy('leader.id')
         .addGroupBy('leader.firstName')
         .addGroupBy('leader.lastName')
         .addGroupBy('leader.email')
         .orderBy('"totalEvents"', 'DESC')
         .getRawMany();

      return results.map(result => ({
        leaderId: parseInt(result.leaderId),
        leaderName: result.leaderName,
        leaderEmail: result.leaderEmail,
        totalEvents: parseInt(result.totalEvents) || 0,
        totalEventsCompleted: parseInt(result.totalEventsCompleted) || 0,
      }));
    } catch (error) {
      throw new Error('Failed to fetch leader history');
    }
  }

  async getCurrentShift(): Promise<LeadershipShift | null> {
    return this.getCurrentActiveShift();
  }

  async getUpcomingShifts(limit: number = 5): Promise<LeadershipShift[]> {
    // First update statuses to ensure accuracy
    await this.updateShiftStatuses();
    
    return this.leadershipShiftRepository.find({
      where: { status: ShiftStatus.UPCOMING },
      relations: ['leader'],
      order: { startDate: 'ASC' },
      take: limit,
    });
  }

  async getShiftsByLeader(leaderId: number): Promise<LeadershipShift[]> {
    return this.leadershipShiftRepository.find({
      where: { leaderId },
      relations: ['leader'],
      order: { startDate: 'DESC' },
    });
  }

  async updateEventCounts(shiftId: number, scheduled: number, completed: number): Promise<void> {
    await this.leadershipShiftRepository.update(shiftId, {
      eventsScheduled: scheduled,
      eventsCompleted: completed,
    });
  }



  /**
   * Automatically update shift statuses based on current date
   * This method should be called periodically or before critical operations
   */
  async updateShiftStatuses(): Promise<{ updated: number; details: any[] }> {
    const now = new Date();
    const details: any[] = [];
    let updated = 0;

    // Get all shifts that need status updates
    const shiftsToUpdate = await this.leadershipShiftRepository.find({
      where: [
        { status: ShiftStatus.UPCOMING },
        { status: ShiftStatus.ACTIVE }
      ],
      relations: ['leader'],
      order: { startDate: 'ASC' }
    });

    for (const shift of shiftsToUpdate) {
      let newStatus: ShiftStatus | null = null;
      let reason = '';

      if (shift.status === ShiftStatus.UPCOMING) {
        // Check if this shift should now be ACTIVE
        if (now >= shift.startDate && now <= shift.endDate) {
          newStatus = ShiftStatus.ACTIVE;
          reason = 'Shift is now within its date range';
        }
      } else if (shift.status === ShiftStatus.ACTIVE) {
        // Check if this shift should now be COMPLETED
        if (now > shift.endDate) {
          newStatus = ShiftStatus.COMPLETED;
          reason = 'Shift end date has passed';
        }
      }

      if (newStatus) {
        // If setting to ACTIVE, first deactivate any other active shifts
        if (newStatus === ShiftStatus.ACTIVE) {
          await this.leadershipShiftRepository.update(
            { status: ShiftStatus.ACTIVE },
            { status: ShiftStatus.COMPLETED }
          );
        }

        // Update the current shift
        await this.leadershipShiftRepository.update(shift.id, { status: newStatus });
        
        details.push({
          shiftId: shift.id,
          shiftName: shift.name,
          leaderName: `${shift.leader.firstName} ${shift.leader.lastName}`,
          oldStatus: shift.status,
          newStatus,
          reason,
          startDate: shift.startDate,
          endDate: shift.endDate
        });
        
        updated++;
      }
    }

    return { updated, details };
  }

  /**
   * Get the current active shift (automatically determined by date)
   */
  async getCurrentActiveShift(): Promise<LeadershipShift | null> {
    // First update statuses to ensure accuracy
    await this.updateShiftStatuses();
    
    // Then get the currently active shift
    return this.leadershipShiftRepository.findOne({
      where: { status: ShiftStatus.ACTIVE },
      relations: ['leader']
    });
  }

  /**
   * Get the next upcoming shift (automatically determined by date)
   */
  async getNextUpcomingShift(): Promise<LeadershipShift | null> {
    // First update statuses to ensure accuracy
    await this.updateShiftStatuses();
    
    // Then get the next upcoming shift
    return this.leadershipShiftRepository.findOne({
      where: { status: ShiftStatus.UPCOMING },
      relations: ['leader'],
      order: { startDate: 'ASC' }
    });
  }

  /**
   * Check if a user is currently on an active shift
   * This method is used by other services to validate user permissions
   */
  async checkUserOnActiveShift(userId: number): Promise<void> {
    // First update statuses to ensure accuracy
    await this.updateShiftStatuses();
    
    const activeShift = await this.leadershipShiftRepository.findOne({
      where: {
        leaderId: userId,
        status: ShiftStatus.ACTIVE,
      },
    });

    if (!activeShift) {
      throw new ForbiddenException('You must be on an active shift to perform this action');
    }
  }
} 