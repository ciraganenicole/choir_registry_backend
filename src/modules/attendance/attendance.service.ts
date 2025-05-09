import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { Attendance, AttendanceStatus, AttendanceType, AttendanceEventType, JustificationReason } from './attendance.entity';
import { UsersService } from '../users/users.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { User } from '../users/user.entity';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';

interface AttendancePaginationOptions {
  page?: number;
  limit?: number;
  eventType?: AttendanceEventType;
  status?: AttendanceStatus;
  startDate?: Date;
  endDate?: Date;
  userId?: number;
  search?: string;
}

interface AttendanceStats {
    total: number;
    present: number;
    absent: number;
    late: number;
    presentPercentage: number;
}

interface AttendanceStatsDetail {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
}

interface GroupedAttendanceStats {
    overall: AttendanceStatsDetail;
    byDate: Record<string, AttendanceStatsDetail>;
    byEventType: Record<string, AttendanceStatsDetail>;
}

interface QueryParams {
    startDate?: Date | string;
    endDate?: Date | string;
    userId?: number;
    eventType?: string;
    status?: string;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
  ) {}

  async create(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    const { date, eventType, ...rest } = createAttendanceDto;

    // Format the date as YYYY-MM-DD string
    const formattedDate = typeof date === 'string' 
      ? date.split('T')[0]  // If it's already a string, just take the date part
      : new Date(date as Date).toISOString().split('T')[0];  // If it's a Date object, convert to YYYY-MM-DD

    // Create the attendance record
    const attendance = new Attendance();
    Object.assign(attendance, {
      ...rest,
      date: formattedDate,
      eventType,
      type: AttendanceType.MANUAL
    });

    return this.attendanceRepository.save(attendance);
  }

  async findAll(filterDto: AttendanceFilterDto): Promise<[Attendance[], number]> {
    const { startDate, endDate, userId, eventType, status, search, page = 1, limit = 10, sortBy = 'date', sortOrder = 'DESC' } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user');

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(attendance.eventName) LIKE LOWER(:search) OR LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (userId) {
      queryBuilder.andWhere('attendance.userId = :userId', { userId });
    }

    if (eventType) {
      queryBuilder.andWhere('attendance.eventType = :eventType', { eventType });
    }

    if (status) {
      queryBuilder.andWhere('attendance.status = :status', { status });
    }

    // Add sorting
    if (sortBy) {
      const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
      queryBuilder.orderBy(`attendance.${sortBy}`, order);
    }

    queryBuilder.skip(skip).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async findByUser(userId: number, filterDto: AttendanceFilterDto): Promise<[Attendance[], number]> {
    return this.findAll({ ...filterDto, userId });
  }

  async findOne(id: number): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  async findAttendanceByUserAndDate(userId: number, date: Date): Promise<Attendance | null> {
    return this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .where('attendance.userId = :userId', { userId })
      .andWhere('attendance.date = :date', { 
        date: date.toISOString().split('T')[0]
      })
      .getOne();
  }

  async getUserAttendance(userId: number, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    const query = this.attendanceRepository.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .where('attendance.userId = :userId', { userId });

    if (startDate && endDate) {
      query.andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    }

    return query.orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.timeIn', 'DESC')
      .getMany();
  }

  async update(id: number, updateAttendanceDto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.findOne(id);
    const { date, eventType, ...rest } = updateAttendanceDto;
    
    let formattedDate = attendance.date;
    if (date) {
      formattedDate = typeof date === 'string'
        ? date.split('T')[0]  // If it's already a string, just take the date part
        : new Date(date as Date).toISOString().split('T')[0];  // If it's a Date object, convert to YYYY-MM-DD
    }

    if (rest.userId) {
      const user = await this.userRepository.findOne({ where: { id: rest.userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${rest.userId} not found`);
      }
      attendance.user = user;
    }

    // Update with formatted values
    Object.assign(attendance, {
      ...rest,
      date: formattedDate,
      eventType: eventType || attendance.eventType
    });

    return this.attendanceRepository.save(attendance);
  }

  async remove(id: number): Promise<void> {
    const result = await this.attendanceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }
  }

  async markManualAttendance(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    return this.create({
      ...createAttendanceDto,
      type: AttendanceType.MANUAL,
    });
  }

  async justifyAbsence(id: number, justification: JustificationReason): Promise<Attendance> {
    const attendance = await this.findOne(id);
    attendance.justification = justification;
    return this.attendanceRepository.save(attendance);
  }

  async getUserAttendanceStats(userId: number, startDate: Date | string, endDate: Date | string): Promise<AttendanceStats> {
    const startDateStr = typeof startDate === 'string' 
      ? startDate.split('T')[0]
      : new Date(startDate).toISOString().split('T')[0];
    const endDateStr = typeof endDate === 'string'
      ? endDate.split('T')[0]
      : new Date(endDate).toISOString().split('T')[0];

    const attendances = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.userId = :userId', { userId })
      .andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr
      })
      .getMany();

    const total = attendances.length;
    const present = attendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const absent = attendances.filter(a => a.status === AttendanceStatus.ABSENT).length;
    const late = attendances.filter(a => a.status === AttendanceStatus.LATE).length;

    return {
      total,
      present,
      absent,
      late,
      presentPercentage: total > 0 ? (present / total) * 100 : 0,
    };
  }

  async getAttendanceStats(startDate: Date | string, endDate: Date | string): Promise<GroupedAttendanceStats> {
    const startDateStr = typeof startDate === 'string'
      ? startDate.split('T')[0]
      : new Date(startDate).toISOString().split('T')[0];
    const endDateStr = typeof endDate === 'string'
      ? endDate.split('T')[0]
      : new Date(endDate).toISOString().split('T')[0];

    const results = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select([
        'attendance.date',
        'attendance.eventType',
        'attendance.status',
        'COUNT(*) as count'
      ])
      .where('attendance.date BETWEEN :startDate AND :endDate', { 
        startDate: startDateStr,
        endDate: endDateStr
      })
      .groupBy('attendance.date')
      .addGroupBy('attendance.eventType')
      .addGroupBy('attendance.status')
      .getRawMany();

    const stats: GroupedAttendanceStats = {
      overall: {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      },
      byDate: {},
      byEventType: {}
    };

    for (const result of results) {
      const count = parseInt(result.count);
      stats.overall.total += count;

      const dateStr = new Date(result.attendance_date).toISOString().split('T')[0];

      // Initialize date stats if not exists
      if (!stats.byDate[dateStr]) {
        stats.byDate[dateStr] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        };
      }

      // Initialize event type stats if not exists
      if (!stats.byEventType[result.attendance_eventtype]) {
        stats.byEventType[result.attendance_eventtype] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        };
      }

      const status = result.attendance_status.toLowerCase() as keyof AttendanceStatsDetail;
      stats.overall[status] += count;
      stats.byDate[dateStr][status] += count;
      stats.byDate[dateStr].total += count;
      stats.byEventType[result.attendance_eventtype][status] += count;
      stats.byEventType[result.attendance_eventtype].total += count;
    }

    return stats;
  }

  async findByDateRange(startDate: Date | string, endDate: Date | string): Promise<Attendance[]> {
    const startDateStr = typeof startDate === 'string'
      ? startDate.split('T')[0]
      : new Date(startDate).toISOString().split('T')[0];
    const endDateStr = typeof endDate === 'string'
      ? endDate.split('T')[0]
      : new Date(endDate).toISOString().split('T')[0];

    return this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .where('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr
      })
      .orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.timeIn', 'ASC')
      .getMany();
  }

  async findByUserAndDateRange(
    userId: number,
    startDate: Date | string,
    endDate: Date | string
  ): Promise<Attendance[]> {
    const startDateStr = typeof startDate === 'string'
      ? startDate.split('T')[0]
      : new Date(startDate).toISOString().split('T')[0];
    const endDateStr = typeof endDate === 'string'
      ? endDate.split('T')[0]
      : new Date(endDate).toISOString().split('T')[0];

    return this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .where('attendance.userId = :userId', { userId })
      .andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr
      })
      .orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.timeIn', 'ASC')
      .getMany();
  }
}
