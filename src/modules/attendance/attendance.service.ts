import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAttendanceDto } from '../../common/dtos/attendance.dto';
import { Attendance, AttendanceStatus } from './attendance.entity';
import { UsersService } from '../users';
import { Event } from '../events/event.entity';
import { PaginationOptions, PaginatedResponse } from '../../common/interfaces/pagination.interface';
import { 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  subMonths,
  subYears 
} from 'date-fns';
import { UserCategory } from '../users/user-category.enum';
import { EventsService } from '../events/events.service';

@Injectable()
export class AttendanceService {
  userRepository: any;
  
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly usersService: UsersService,
    private readonly eventsService: EventsService, // Injecting the EventsService
  ) {}

  // Mark attendance for a user based on event category
  async markAttendance(eventId: number, userId: number): Promise<Attendance> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if the user is allowed to access the event based on category
    const user = await this.usersService.getOneUser(userId);
    const userCategories = user.categories;  // Assuming the User has a categories field
    const allowedCategories = [UserCategory.WORSHIPPER, UserCategory.COMMITTEE];

    if (!userCategories.some(category => allowedCategories.includes(category))) {
      throw new ForbiddenException('Access denied: You are not authorized to attend this event.');
    }

    // Check if the event belongs to the allowed categories
    if (![UserCategory.WORSHIPPER, UserCategory.COMMITTEE].includes(event.category)) {
      throw new ForbiddenException('This event is restricted to specific categories.');
    }

    const attendance = new Attendance();
    attendance.event = event;
    attendance.user = user;

    return this.attendanceRepository.save(attendance);
  }

  // Get attendance by event ID
  async getAttendanceByEvent(eventId: number): Promise<Attendance[]> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return this.attendanceRepository.find({ where: { event }, relations: ['user'] });
  }

  // Get attendance for a specific user
  async getUserAttendance(userId: number): Promise<Attendance[]> {
    const user = await this.usersService.getOneUser(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.attendanceRepository.find({ where: { user }, relations: ['event'] });
  }

  // Get attendance summary for a specific event
  async getAttendanceSummary(eventId: number): Promise<{ event: Event; total: number }> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const total = await this.attendanceRepository.count({ where: { event } });

    return { event, total };
  }

  // Find all attendance records with pagination
  async findAll(options: PaginationOptions = {}): Promise<PaginatedResponse<Attendance>> {
    const { page = 1, limit = 10, search, sortBy = 'date', sortOrder = 'DESC' } = options;
    
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .leftJoinAndSelect('attendance.event', 'event');

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.surname ILIKE :search OR event.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const total = await queryBuilder.getCount();
    
    const items = await queryBuilder
      .orderBy(`attendance.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Find one attendance by ID
  async findOne(id: number): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['user']
    });
    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }
    return attendance;
  }

  // Find attendance by user with pagination
  async findByUser(
    userId: number, 
    options: PaginationOptions = {}
  ): Promise<PaginatedResponse<Attendance>> {
    const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'DESC' } = options;
    
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.event', 'event')
      .where('attendance.user.id = :userId', { userId });

    const total = await queryBuilder.getCount();
    
    const items = await queryBuilder
      .orderBy(`attendance.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Find attendance by event
  async findByEvent(eventId: number): Promise<Attendance[]> {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    
    return this.attendanceRepository.find({
      where: { event: { id: eventId } },
      relations: ['user', 'event']
    });
  }

  // Justify an absence for a specific attendance record
  async justifyAbsence(id: number, justified: boolean): Promise<Attendance> {
    const attendance = await this.findOne(id);
    attendance.justified = justified;
    return this.attendanceRepository.save(attendance);
  }

  // Determine attendance status based on event start time
  private determineAttendanceStatus(event: Event): AttendanceStatus {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes

    const [eventStartHour, eventStartMinute] = event.startTime.split(':').map(Number);
    const eventStartInMinutes = eventStartHour * 60 + eventStartMinute;

    // Define a grace period (e.g., 15 minutes)
    const gracePeriod = 15;

    if (currentTime <= eventStartInMinutes + gracePeriod) {
      return AttendanceStatus.PRESENT;
    } else {
      return AttendanceStatus.LATE;
    }
  }

  // Get attendance statistics for a specific date range
  async getAttendanceStats(
    startDate?: Date,
    endDate?: Date,
    groupBy: 'week' | 'month' | 'year' = 'month',
    preset?: 'current_week' | 'current_month' | 'current_year' | 'last_3_months' | 'last_year'
  ) {
    try {
      const now = new Date();

      // If no dates provided and no preset, default to current month
      if (!startDate && !endDate && !preset) {
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
      }
      
      // Handle preset ranges
      if (preset) {
        switch (preset) {
          case 'current_week':
            startDate = startOfWeek(now);
            endDate = endOfWeek(now);
            break;
          case 'current_month':
            startDate = startOfMonth(now);
            endDate = endOfMonth(now);
            break;
          case 'current_year':
            startDate = startOfYear(now);
            endDate = endOfYear(now);
            break;
          case 'last_3_months':
            startDate = startOfMonth(subMonths(now, 3));
            endDate = endOfMonth(now);
            break;
          case 'last_year':
            startDate = startOfYear(subYears(now, 1));
            endDate = endOfYear(subYears(now, 1));
            break;
        }
      }

      const query = this.attendanceRepository
        .createQueryBuilder('attendance')
        .where('attendance.date BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });

      // Add status to the query
      query.andWhere('attendance.status = :status', { 
        status: 'PRESENT' 
      });

      switch (groupBy) {
        case 'week':
          query
            .select([ 
              "DATE_TRUNC('week', attendance.date) AS period", 
              'COUNT(DISTINCT attendance.userId) AS total_attendees',
              'COUNT(*) AS total_attendances' 
            ])
            .groupBy('period')
            .orderBy('period', 'ASC');
          break;

        case 'month':
          query
            .select([ 
              "DATE_TRUNC('month', attendance.date) AS period", 
              'COUNT(DISTINCT attendance.userId) AS total_attendees',
              'COUNT(*) AS total_attendances' 
            ])
            .groupBy('period')
            .orderBy('period', 'ASC');
          break;

        case 'year':
          query
            .select([ 
              "DATE_TRUNC('year', attendance.date) AS period", 
              'COUNT(DISTINCT attendance.userId) AS total_attendees',
              'COUNT(*) AS total_attendances' 
            ])
            .groupBy('period')
            .orderBy('period', 'ASC');
          break;
      }

      const stats = await query.getRawMany();

      return stats.map(stat => ({
        period: stat.period,
        totalAttendees: parseInt(stat.total_attendees) || 0,
        totalAttendances: parseInt(stat.total_attendances) || 0,
        averageAttendancePerPerson: stat.total_attendees > 0 
          ? parseFloat((stat.total_attendances / stat.total_attendees).toFixed(2))
          : 0
      }));
    } catch (error) {
      console.error('Database error:', error);
      throw new BadRequestException('Failed to get attendance stats');
    }
  }
}
