import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { Attendance, AttendanceStatus, AttendanceType, AttendanceEventType, JustificationReason } from './attendance.entity';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { User } from '../users/user.entity';
import { AttendanceFilterDto } from './dto/attendance-filter.dto';
import { UserCategory } from '../users/enums/user-category.enum';

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
  /** User columns for joined `user` relation (no password / fingerprintData from DB). */
  private static readonly USER_PUBLIC_SELECT: (keyof User)[] = [
    'id',
    'firstName',
    'lastName',
    'email',
    'matricule',
    'phoneNumber',
    'whatsappNumber',
    'phone',
    'categories',
    'commissions',
    'gender',
    'maritalStatus',
    'educationLevel',
    'profession',
    'competenceDomain',
    'churchOfOrigin',
    'commune',
    'quarter',
    'reference',
    'address',
    'joinDate',
    'isActive',
    'profileImageUrl',
    'voiceCategory',
    'createdAt',
    'updatedAt',
  ];

  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private addAttendanceUserPublicSelect(qb: SelectQueryBuilder<Attendance>): void {
    qb.leftJoin('attendance.user', 'user');
    for (const col of AttendanceService.USER_PUBLIC_SELECT) {
      qb.addSelect(`user.${String(col)}`);
    }
  }

  private async loadUserPublic(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [...AttendanceService.USER_PUBLIC_SELECT],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  private applyAttendanceListFilters(
    qb: SelectQueryBuilder<Attendance>,
    filterDto: AttendanceFilterDto,
  ): void {
    const { startDate, endDate, userId, eventType, status, search } = filterDto;

    const formatDate = (dateStr: string): string => dateStr.split('T')[0];

    if (!startDate && !endDate) {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const finalStartDate = firstDayOfMonth.toISOString().split('T')[0];
      const finalEndDate = lastDayOfMonth.toISOString().split('T')[0];
      qb.andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: finalStartDate,
        endDate: finalEndDate,
      });
    } else if (startDate && endDate) {
      qb.andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      });
    }

    if (userId) {
      qb.andWhere('attendance.userId = :userId', { userId });
    }
    if (eventType) {
      qb.andWhere('attendance.eventType = :eventType', { eventType });
    }
    if (status) {
      qb.andWhere('attendance.status = :status', { status });
    }
    if (search) {
      qb.andWhere(
        '(LOWER(attendance.eventName) LIKE LOWER(:search) OR LOWER(user.firstName) LIKE LOWER(:search) OR LOWER(user.lastName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }
  }

  async create(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    const { date, eventType, ...rest } = createAttendanceDto;

    // Format the date as YYYY-MM-DD string (extract date part from ISO string if needed)
    const formattedDate = date.split('T')[0];

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
    const { search, page = 1, limit = 10, sortBy = 'date', sortOrder = 'DESC' } = filterDto;
    const skip = (page - 1) * limit;

    const countQb = this.attendanceRepository.createQueryBuilder('attendance');
    if (search) {
      countQb.leftJoin('attendance.user', 'user');
    }
    this.applyAttendanceListFilters(countQb, filterDto);
    const countRow = await countQb.select('COUNT(DISTINCT attendance.id)', 'cnt').getRawOne();
    const total = Number(countRow?.cnt ?? 0);

    const dataQb = this.attendanceRepository.createQueryBuilder('attendance');
    this.addAttendanceUserPublicSelect(dataQb);
    this.applyAttendanceListFilters(dataQb, filterDto);

    if (sortBy) {
      const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
      dataQb.orderBy(`attendance.${sortBy}`, order);
    }
    dataQb.skip(skip).take(limit);

    const rows = await dataQb.getMany();
    return [rows, total];
  }

  async findByUser(userId: number, filterDto: AttendanceFilterDto): Promise<[Attendance[], number]> {
    return this.findAll({ ...filterDto, userId });
  }

  async findOne(id: number): Promise<Attendance> {
    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.id = :id', { id });
    this.addAttendanceUserPublicSelect(qb);
    const attendance = await qb.getOne();

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  async findAttendanceByUserAndDate(userId: number, date: Date): Promise<Attendance | null> {
    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.userId = :userId', { userId })
      .andWhere('attendance.date = :date', {
        date: date.toISOString().split('T')[0],
      });
    this.addAttendanceUserPublicSelect(qb);
    return qb.getOne();
  }

  async getUserAttendance(userId: number, startDate?: Date, endDate?: Date): Promise<Attendance[]> {
    const query = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.userId = :userId', { userId });
    this.addAttendanceUserPublicSelect(query);

    if (startDate && endDate) {
      query.andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
    }

    return query
      .orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.timeIn', 'DESC')
      .getMany();
  }

  async update(id: number, updateAttendanceDto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.findOne(id);
    const { date, eventType, ...rest } = updateAttendanceDto;
    
    let formattedDate = attendance.date;
    if (date) {
      // Extract date part from ISO string
      formattedDate = date.split('T')[0];
    }

    if (rest.userId) {
      attendance.user = await this.loadUserPublic(rest.userId);
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

  async markAllUsersAbsent(date: Date | string, eventType: AttendanceEventType): Promise<void> {
    const formattedDate =
      typeof date === 'string'
        ? date.split('T')[0]
        : new Date(date as Date).toISOString().split('T')[0];

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .where('(user.isActive = :isActive OR :newcomer = ANY(user.categories))', {
        isActive: true,
        newcomer: UserCategory.NEWCOMER,
      })
      .getMany();

    const attendanceRecords = users.map((user) => {
      const attendance = new Attendance();
      Object.assign(attendance, {
        userId: user.id,
        date: formattedDate,
        eventType,
        status: AttendanceStatus.ABSENT,
        type: AttendanceType.MANUAL
      });
      return attendance;
    });

    // Save all records
    await this.attendanceRepository.save(attendanceRecords);
  }

  async markAttendance(createAttendanceDto: CreateAttendanceDto): Promise<Attendance> {
    const { userId, date, eventType, status, timeIn, justification } = createAttendanceDto;

    const user = await this.loadUserPublic(userId);

    // Check if user is active or is a newcomer
    const isNewcomer = user.categories?.includes(UserCategory.NEWCOMER);
    if (!user.isActive && !isNewcomer) {
      throw new BadRequestException(`Cannot mark attendance for inactive user with ID ${userId} who is not a newcomer`);
    }

    // Format the date as YYYY-MM-DD string
    const formattedDate = typeof date === 'string' 
      ? date.split('T')[0]  // If it's already a string, just take the date part
      : new Date(date as Date).toISOString().split('T')[0];  // If it's a Date object, convert to YYYY-MM-DD

    // Check if any attendance records exist for this date
    const existingAttendance = await this.attendanceRepository.find({
      where: {
        date: formattedDate,
        eventType
      }
    });

    // If no records exist, initialize all users as absent
    if (existingAttendance.length === 0) {
      await this.initializeAttendance(formattedDate, eventType);
    }

    // Check if attendance record exists for this user
    let attendance = await this.findAttendanceByUserAndDate(userId, new Date(formattedDate));

    if (!attendance) {
      // Create new attendance record
      attendance = new Attendance();
      attendance.userId = userId;
      attendance.date = formattedDate;
      attendance.eventType = eventType;
      attendance.status = status;
      attendance.type = AttendanceType.MANUAL;
      
      // Set timeIn if provided
      if (timeIn) {
        attendance.timeIn = timeIn;
      }

      // Set justification if provided
      if (justification) {
        attendance.justification = justification;
      }

      return this.attendanceRepository.save(attendance);
    }

    // Update existing attendance record
    attendance.status = status;
    
    // Update timeIn if provided
    if (timeIn) {
      attendance.timeIn = timeIn;
    }

    // Update justification if provided
    if (justification) {
      attendance.justification = justification;
    }

    return this.attendanceRepository.save(attendance);
  }

  async justifyAbsence(id: number, justification: JustificationReason): Promise<Attendance> {
    const attendance = await this.findOne(id);
    attendance.justification = justification;
    return this.attendanceRepository.save(attendance);
  }

  async getUserAttendanceStats(
    userId: number,
    startDate: Date | string,
    endDate: Date | string,
  ): Promise<AttendanceStats> {
    const startDateStr =
      typeof startDate === 'string'
        ? startDate.split('T')[0]
        : new Date(startDate).toISOString().split('T')[0];
    const endDateStr =
      typeof endDate === 'string'
        ? endDate.split('T')[0]
        : new Date(endDate).toISOString().split('T')[0];

    const p = AttendanceStatus.PRESENT;
    const a = AttendanceStatus.ABSENT;
    const l = AttendanceStatus.LATE;

    const row = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('COUNT(*)', 'total')
      .addSelect(
        `COUNT(*) FILTER (WHERE attendance.status = '${p}')`,
        'present',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE attendance.status = '${a}')`,
        'absent',
      )
      .addSelect(`COUNT(*) FILTER (WHERE attendance.status = '${l}')`, 'late')
      .where('attendance.userId = :userId', { userId })
      .andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      })
      .getRawOne();

    const total = Number(row?.total ?? 0);
    const present = Number(row?.present ?? 0);
    const absent = Number(row?.absent ?? 0);
    const late = Number(row?.late ?? 0);

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
      .select('attendance.date', 'date')
      .addSelect('attendance.eventType', 'eventType')
      .addSelect('attendance.status', 'status')
      .addSelect('COUNT(*)', 'cnt')
      .where('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
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
        excused: 0,
      },
      byDate: {},
      byEventType: {},
    };

    for (const result of results) {
      const count = parseInt(String(result.cnt ?? result.count ?? 0), 10);
      if (!Number.isFinite(count)) {
        continue;
      }
      stats.overall.total += count;

      const dateRaw = result.date ?? result.attendance_date;
      const dateStr =
        typeof dateRaw === 'string'
          ? dateRaw.split('T')[0]
          : new Date(dateRaw).toISOString().split('T')[0];

      const eventTypeKey = String(result.eventType ?? result.attendance_eventtype ?? '');
      const statusRaw = result.status ?? result.attendance_status;
      if (!statusRaw) {
        continue;
      }
      const status = String(statusRaw).toLowerCase() as keyof AttendanceStatsDetail;
      if (!(status in stats.overall)) {
        continue;
      }

      if (!stats.byDate[dateStr]) {
        stats.byDate[dateStr] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      }

      if (!stats.byEventType[eventTypeKey]) {
        stats.byEventType[eventTypeKey] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      }

      stats.overall[status] += count;
      stats.byDate[dateStr][status] += count;
      stats.byDate[dateStr].total += count;
      stats.byEventType[eventTypeKey][status] += count;
      stats.byEventType[eventTypeKey].total += count;
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

    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      });
    this.addAttendanceUserPublicSelect(qb);
    return qb
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

    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.userId = :userId', { userId })
      .andWhere('attendance.date BETWEEN :startDate AND :endDate', {
        startDate: startDateStr,
        endDate: endDateStr,
      });
    this.addAttendanceUserPublicSelect(qb);
    return qb
      .orderBy('attendance.date', 'DESC')
      .addOrderBy('attendance.timeIn', 'ASC')
      .getMany();
  }

  async markRemainingUsersAbsent(date: Date | string, eventType: AttendanceEventType): Promise<void> {
    // Format the date as YYYY-MM-DD string
    const formattedDate = typeof date === 'string' 
      ? date.split('T')[0]
      : new Date(date as Date).toISOString().split('T')[0];

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .where('user.isActive = :isActive', { isActive: true })
      .getMany();

    // Get existing attendance records for this date
    const existingAttendance = await this.attendanceRepository.find({
      where: {
        date: formattedDate,
        eventType
      }
    });

    // Get IDs of users who already have attendance records
    const markedUserIds = new Set(existingAttendance.map(a => a.userId));

    // Create attendance records only for users who haven't been marked yet
    const attendanceRecords = users
      .filter(user => !markedUserIds.has(user.id))
      .map(user => {
        const attendance = new Attendance();
        Object.assign(attendance, {
          userId: user.id,
          date: formattedDate,
          eventType,
          status: AttendanceStatus.ABSENT,
          type: AttendanceType.MANUAL
        });
        return attendance;
      });

    // Save new records if there are any
    if (attendanceRecords.length > 0) {
      await this.attendanceRepository.save(attendanceRecords);
    }
  }

  async initializeAttendance(date: Date | string, eventType: AttendanceEventType, status: AttendanceStatus = AttendanceStatus.ABSENT): Promise<Attendance[]> {
    // Format the date as YYYY-MM-DD string
    const formattedDate = typeof date === 'string' 
      ? date.split('T')[0]
      : new Date(date as Date).toISOString().split('T')[0];

    // Check if any attendance records exist for this date
    const existingAttendance = await this.attendanceRepository.find({
      where: {
        date: formattedDate,
        eventType
      }
    });

    // If records exist, return them
    if (existingAttendance.length > 0) {
      return existingAttendance;
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .where('(user.isActive = :isActive OR :newcomer = ANY(user.categories))', {
        isActive: true,
        newcomer: UserCategory.NEWCOMER,
      })
      .getMany();

    const attendanceRecords = users.map((user) => {
      const attendance = new Attendance();
      Object.assign(attendance, {
        userId: user.id,
        date: formattedDate,
        eventType,
        status,
        type: AttendanceType.MANUAL,
      });
      return attendance;
    });

    return this.attendanceRepository.save(attendanceRecords);
  }

  async findUnjustifiedAbsencesFromWeek(): Promise<Attendance[]> {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 3 = Wednesday, 6 = Saturday
    
    // Calculate days until this week's Wednesday (day 3) and Saturday (day 6)
    const daysUntilWednesday = 3 - currentDay;
    const daysUntilSaturday = 6 - currentDay;
    
    const wednesday = new Date(today);
    wednesday.setDate(today.getDate() + daysUntilWednesday);
    
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSaturday);
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const wednesdayStr = formatDate(wednesday);
    const saturdayStr = formatDate(saturday);
    
    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.status = :status')
      .andWhere('attendance.justification IS NULL')
      .andWhere('attendance.eventType = :eventType')
      .andWhere('attendance.date IN (:...dates)')
      .andWhere(
        `EXISTS (
          SELECT 1 FROM attendance a1
          WHERE a1."userId" = attendance."userId"
          AND a1.status = :status
          AND a1.justification IS NULL
          AND a1."eventType" = :eventType
          AND a1.date = :wednesday
        )`
      )
      .andWhere(
        `EXISTS (
          SELECT 1 FROM attendance a2
          WHERE a2."userId" = attendance."userId"
          AND a2.status = :status
          AND a2.justification IS NULL
          AND a2."eventType" = :eventType
          AND a2.date = :saturday
        )`
      )
      .setParameters({
        status: AttendanceStatus.ABSENT,
        eventType: AttendanceEventType.REHEARSAL,
        wednesday: wednesdayStr,
        saturday: saturdayStr,
        dates: [wednesdayStr, saturdayStr],
      });
    this.addAttendanceUserPublicSelect(qb);
    return qb
      .orderBy('attendance.date', 'ASC')
      .addOrderBy('user.lastName', 'ASC')
      .getMany();
  }
}
