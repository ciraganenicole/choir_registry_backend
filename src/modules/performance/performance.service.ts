import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Performance, PerformanceType, PerformanceStatus } from './performance.entity';
import { PerformanceSong } from './performance-song.entity';
import { PerformanceSongMusician, InstrumentType } from './performance-song-musician.entity';
import { PerformanceVoicePart } from './performance-voice-part.entity';
import { Song } from '../song/song.entity';
import { User } from '../users/user.entity';
import { UserCategory } from '../users/enums/user-category.enum';
import { AdminRole } from '../admin/admin-role.enum';
import { LeadershipShift, ShiftStatus } from '../leadership-shift/leadership-shift.entity';
import { LeadershipShiftService } from '../leadership-shift/leadership-shift.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';
import { PerformanceFilterDto } from './dto/performance-filter.dto';
import { RehearsalService } from '../rehearsal/rehearsal.service';

export interface PerformanceStats {
  totalPerformances: number;
  completedPerformances: number;
  upcomingPerformances: number;
  byType: Record<PerformanceType, number>;
  byStatus: Record<PerformanceStatus, number>;
  byMonth: Record<string, number>;
}

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(Performance)
    private readonly performanceRepository: Repository<Performance>,
    @InjectRepository(PerformanceSong)
    private readonly performanceSongRepository: Repository<PerformanceSong>,
    @InjectRepository(PerformanceSongMusician)
    private readonly performanceSongMusicianRepository: Repository<PerformanceSongMusician>,
    @InjectRepository(PerformanceVoicePart)
    private readonly performanceVoicePartRepository: Repository<PerformanceVoicePart>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LeadershipShift)
    private readonly leadershipShiftRepository: Repository<LeadershipShift>,
    private readonly leadershipShiftService: LeadershipShiftService,
    private readonly rehearsalService: RehearsalService,
  ) {}

  async create(createPerformanceDto: CreatePerformanceDto, userId: number, userType: string, userRole?: string): Promise<Performance> {
    // Check if user is SUPER_ADMIN (no additional checks needed)
    const isSuperAdmin = userType === 'admin' && userRole === AdminRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      // For non-SUPER_ADMIN users, get the user to check their category
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user is LEAD category and verify they are on their active shift
      if (user.categories?.includes(UserCategory.LEAD)) {
        await this.leadershipShiftService.checkUserOnActiveShift(userId);
      } else {
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can create performances');
      }
    }

    // Verify shift lead exists and is a LEAD user (only if provided)
    if (createPerformanceDto.shiftLeadId) {
      const shiftLead = await this.userRepository.findOneBy({ id: createPerformanceDto.shiftLeadId });
      if (!shiftLead) {
        throw new NotFoundException(`Shift lead with ID ${createPerformanceDto.shiftLeadId} not found`);
      }

      // Verify the assigned shift lead is actually a LEAD user
      if (!shiftLead.categories?.includes(UserCategory.LEAD)) {
        throw new BadRequestException(`User with ID ${createPerformanceDto.shiftLeadId} is not a LEAD user`);
      }
    }

    // Allow creating performances for future dates (planning ahead)
    const performanceDate = new Date(createPerformanceDto.date);
    const now = new Date();
    
    // Optional: Add a reasonable limit for future planning (e.g., 2 years)
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);
    
    if (performanceDate > maxFutureDate) {
      throw new BadRequestException('Cannot create performances more than 2 years in the future');
    }

    // Create performance
    const performance = this.performanceRepository.create({
      date: performanceDate,
      location: createPerformanceDto.location,
      expectedAudience: createPerformanceDto.expectedAudience,
      type: createPerformanceDto.type,
      shiftLeadId: createPerformanceDto.shiftLeadId,
      notes: createPerformanceDto.notes,
      status: createPerformanceDto.status || PerformanceStatus.UPCOMING,
    });

    return this.performanceRepository.save(performance);
  }

  async findAll(filterDto: PerformanceFilterDto): Promise<[Performance[], number]> {
    const { page = 1, limit = 10, search, type, status, date, shiftLeadId } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.performanceRepository
      .createQueryBuilder('performance')
      .leftJoinAndSelect('performance.shiftLead', 'shiftLead');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(performance.location) LIKE LOWER(:search) OR LOWER(performance.notes) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    if (type) {
      queryBuilder.andWhere('performance.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('performance.status = :status', { status });
    }

    if (date) {
      // Filter by specific date (ignoring time)
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
      
      queryBuilder.andWhere('performance.date BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      });
    }

    if (shiftLeadId) {
      queryBuilder.andWhere('performance.shiftLeadId = :shiftLeadId', { shiftLeadId });
    }

    // Order by date (newest first)
    queryBuilder.orderBy('performance.date', 'DESC');

    queryBuilder.skip(skip).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async findOne(id: number): Promise<Performance> {
    const performance = await this.performanceRepository.findOne({
      where: { id },
      relations: [
        'shiftLead',
        'performanceSongs',
        'performanceSongs.song',
        'performanceSongs.leadSinger',
        'performanceSongs.musicians',
        'performanceSongs.musicians.user',
        'performanceSongs.voiceParts',
        'performanceSongs.voiceParts.members',
      ],
      order: {
        performanceSongs: {
          order: 'ASC',
        },
      },
    });

    if (!performance) {
      throw new NotFoundException(`Performance with ID ${id} not found`);
    }

    return performance;
  }

  async update(id: number, updatePerformanceDto: UpdatePerformanceDto, userId: number, userType: string, userRole?: string): Promise<Performance> {
    const performance = await this.findOne(id);

    // Check if user is SUPER_ADMIN (no additional checks needed)
    const isSuperAdmin = userType === 'admin' && userRole === AdminRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      // For non-SUPER_ADMIN users, get the user to check their category
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user is LEAD category and verify they are on their active shift
      if (user.categories?.includes(UserCategory.LEAD)) {
        await this.leadershipShiftService.checkUserOnActiveShift(userId);
      } else {
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can update performances');
      }
    }

    // Update basic fields
    if (updatePerformanceDto.date) {
      const performanceDate = new Date(updatePerformanceDto.date);
      
      // Allow updating to future dates (planning ahead)
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);
      
      if (performanceDate > maxFutureDate) {
        throw new BadRequestException('Cannot schedule performances more than 2 years in the future');
      }
      
      performance.date = performanceDate;
    }
    if (updatePerformanceDto.type) {
      performance.type = updatePerformanceDto.type;
    }
    if (updatePerformanceDto.status) {
      performance.status = updatePerformanceDto.status;
    }
    if (updatePerformanceDto.location !== undefined) {
      performance.location = updatePerformanceDto.location;
    }
    if (updatePerformanceDto.expectedAudience !== undefined) {
      performance.expectedAudience = updatePerformanceDto.expectedAudience;
    }
    if (updatePerformanceDto.notes !== undefined) {
      performance.notes = updatePerformanceDto.notes;
    }

    // Update relationships if provided
    if (updatePerformanceDto.shiftLeadId !== undefined) {
      if (updatePerformanceDto.shiftLeadId === null || updatePerformanceDto.shiftLeadId === 0) {
        // Allow unassigning the shift lead
        performance.shiftLeadId = null;
      } else {
        const shiftLead = await this.userRepository.findOneBy({ id: updatePerformanceDto.shiftLeadId });
        if (!shiftLead) {
          throw new BadRequestException(`Shift lead with ID ${updatePerformanceDto.shiftLeadId} not found`);
        }
        
        // Verify the assigned shift lead is actually a LEAD user
        if (!shiftLead.categories?.includes(UserCategory.LEAD)) {
          throw new BadRequestException(`User with ID ${updatePerformanceDto.shiftLeadId} is not a LEAD user`);
        }
        
        performance.shiftLeadId = updatePerformanceDto.shiftLeadId;
      }
    }

    // Save the updated performance
    await this.performanceRepository.save(performance);

    return this.findOne(id);
  }

  async remove(id: number, userId: number, userType: string, userRole?: string): Promise<void> {
    const performance = await this.findOne(id);

    // Check if user is SUPER_ADMIN (no additional checks needed)
    const isSuperAdmin = userType === 'admin' && userRole === AdminRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      // For non-SUPER_ADMIN users, get the user to check their category
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if user is LEAD category and verify they are on their active shift
      if (user.categories?.includes(UserCategory.LEAD)) {
        await this.leadershipShiftService.checkUserOnActiveShift(userId);
      } else {
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can delete performances');
      }
    }

    await this.performanceRepository.remove(performance);
  }

  async findByUser(userId: number): Promise<Performance[]> {
    return this.performanceRepository.find({
      where: { shiftLeadId: userId },
      relations: [
        'shiftLead',
      ],
      order: { date: 'DESC' },
    });
  }

  async findUnassigned(filterDto: PerformanceFilterDto): Promise<[Performance[], number]> {
    const { page = 1, limit = 10, search, type, status, date } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.performanceRepository
      .createQueryBuilder('performance')
      .leftJoinAndSelect('performance.shiftLead', 'shiftLead')
      .where('performance.shiftLeadId IS NULL');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(performance.location) LIKE LOWER(:search) OR LOWER(performance.notes) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    if (type) {
      queryBuilder.andWhere('performance.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('performance.status = :status', { status });
    }

    if (date) {
      // Filter by specific date (ignoring time)
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
      
      queryBuilder.andWhere('performance.date BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      });
    }

    // Order by date (newest first)
    queryBuilder.orderBy('performance.date', 'DESC');

    queryBuilder.skip(skip).take(limit);

    return queryBuilder.getManyAndCount();
  }

  async getStats(): Promise<PerformanceStats> {
    const performances = await this.performanceRepository.find({
      relations: ['shiftLead'],
    });

    const stats: PerformanceStats = {
      totalPerformances: performances.length,
      completedPerformances: performances.filter(p => p.status === PerformanceStatus.COMPLETED).length,
      upcomingPerformances: performances.filter(p => p.status === PerformanceStatus.UPCOMING || p.status === PerformanceStatus.IN_PREPARATION).length,
      byType: {} as Record<PerformanceType, number>,
      byStatus: {} as Record<PerformanceStatus, number>,
      byMonth: {},
    };

    // Calculate stats by type
    performances.forEach(performance => {
      stats.byType[performance.type] = (stats.byType[performance.type] || 0) + 1;
    });

    // Calculate stats by status
    performances.forEach(performance => {
      stats.byStatus[performance.status] = (stats.byStatus[performance.status] || 0) + 1;
    });

    // Calculate monthly stats
    performances.forEach(performance => {
      const month = performance.date.toISOString().substring(0, 7); // YYYY-MM format
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    });

    return stats;
  }

  /**
   * Mark a performance as in preparation (ready for rehearsals)
   */
  async markInPreparation(
    id: number, 
    userId: number, 
    userType: string, 
    userRole?: string
  ): Promise<Performance> {
    const performance = await this.findOne(id);
    
    // Check permissions
    const isSuperAdmin = userType === 'admin' && userRole === AdminRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (user.categories?.includes(UserCategory.LEAD)) {
        await this.leadershipShiftService.checkUserOnActiveShift(userId);
      } else {
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can update performance status');
      }
    }

    // Check if performance can be marked as in preparation
    if (performance.status !== PerformanceStatus.UPCOMING) {
      throw new BadRequestException(`Performance must be in 'upcoming' status to mark as in preparation. Current status: ${performance.status}`);
    }

    performance.status = PerformanceStatus.IN_PREPARATION;
    await this.performanceRepository.save(performance);

    return this.findOne(id);
  }

  /**
   * Mark a performance as completed
   */
  async markCompleted(
    id: number, 
    userId: number, 
    userType: string, 
    userRole?: string
  ): Promise<Performance> {
    const performance = await this.findOne(id);
    
    // Check permissions
    const isSuperAdmin = userType === 'admin' && userRole === AdminRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (user.categories?.includes(UserCategory.LEAD)) {
        await this.leadershipShiftService.checkUserOnActiveShift(userId);
      } else {
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can update performance status');
      }
    }

    // Check if performance can be marked as completed
    if (performance.status !== PerformanceStatus.READY) {
      throw new BadRequestException(`Performance must be in 'ready' status to mark as completed. Current status: ${performance.status}`);
    }

    performance.status = PerformanceStatus.COMPLETED;
    await this.performanceRepository.save(performance);

    return this.findOne(id);
  }

  /**
   * Helper function to map string instrument names to InstrumentType enum values
   */
  private mapInstrumentToEnum(instrumentString: string): InstrumentType {
    // Create a mapping from string to enum
    const instrumentMap: Record<string, InstrumentType> = {
      'Piano': InstrumentType.PIANO,
      'Organ': InstrumentType.ORGAN,
      'Keyboard': InstrumentType.KEYBOARD,
      'Synthesizer': InstrumentType.SYNTHESIZER,
      'Accordion': InstrumentType.ACCORDION,
      'Piano Accompaniment': InstrumentType.PIANO_ACCOMPANIMENT,
      'Guitar': InstrumentType.GUITAR,
      'Acoustic Guitar': InstrumentType.ACOUSTIC_GUITAR,
      'Electric Guitar': InstrumentType.ELECTRIC_GUITAR,
      'Bass': InstrumentType.BASS,
      'Bass Guitar': InstrumentType.BASS_GUITAR,
      'Violin': InstrumentType.VIOLIN,
      'Viola': InstrumentType.VIOLA,
      'Cello': InstrumentType.CELLO,
      'Double Bass': InstrumentType.DOUBLE_BASS,
      'Harp': InstrumentType.HARP,
      'Mandolin': InstrumentType.MANDOLIN,
      'Ukulele': InstrumentType.UKULELE,
      'Flute': InstrumentType.FLUTE,
      'Piccolo': InstrumentType.PICCOLO,
      'Clarinet': InstrumentType.CLARINET,
      'Oboe': InstrumentType.OBOE,
      'Bassoon': InstrumentType.BASSOON,
      'Trumpet': InstrumentType.TRUMPET,
      'Trombone': InstrumentType.TROMBONE,
      'French Horn': InstrumentType.FRENCH_HORN,
      'Saxophone': InstrumentType.SAXOPHONE,
      'Alto Saxophone': InstrumentType.ALTO_SAXOPHONE,
      'Tenor Saxophone': InstrumentType.TENOR_SAXOPHONE,
      'Baritone Saxophone': InstrumentType.BARITONE_SAXOPHONE,
      'Euphonium': InstrumentType.EUPHONIUM,
      'Tuba': InstrumentType.TUBA,
      'Drums': InstrumentType.DRUMS,
      'Drum Kit': InstrumentType.DRUM_KIT,
      'Snare Drum': InstrumentType.SNARE_DRUM,
      'Bass Drum': InstrumentType.BASS_DRUM,
      'Cymbals': InstrumentType.CYMBALS,
      'Tambourine': InstrumentType.TAMBOURINE,
      'Maracas': InstrumentType.MARACAS,
      'Congas': InstrumentType.CONGAS,
      'Bongos': InstrumentType.BONGOS,
      'Timpani': InstrumentType.TIMPANI,
      'Xylophone': InstrumentType.XYLOPHONE,
      'Glockenspiel': InstrumentType.GLOCKENSPIEL,
      'Chimes': InstrumentType.CHIMES,
      'Bells': InstrumentType.BELLS,
      'Conga Drums': InstrumentType.CONGA_DRUMS,
      'Bongo Drums': InstrumentType.BONGO_DRUMS,
      'Harmonica': InstrumentType.HARMONICA,
      'Kalimba': InstrumentType.KALIMBA,
      'Recorder': InstrumentType.RECORDER,
      'Pan Flute': InstrumentType.PAN_FLUTE,
      'Didgeridoo': InstrumentType.DIDGERIDOO,
      'Other': InstrumentType.OTHER,
    };

    return instrumentMap[instrumentString] || InstrumentType.OTHER;
  }

  /**
   * Promote multiple rehearsals to populate their linked performances with detailed data
   * This method copies all the detailed information from multiple rehearsals to their respective performances
   * Songs are added to performances, not replaced (duplicates are skipped)
   */
  async promoteRehearsals(
    rehearsalIds: number[], 
    userId: number, 
    userType: string, 
    userRole?: string
  ): Promise<{ success: number; errors: Array<{ rehearsalId: number; error: string }> }> {
    // Check permissions
    const isSuperAdmin = userType === 'admin' && userRole === AdminRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (user.categories?.includes(UserCategory.LEAD)) {
        await this.leadershipShiftService.checkUserOnActiveShift(userId);
      } else {
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can promote rehearsals');
      }
    }

    if (!rehearsalIds || rehearsalIds.length === 0) {
      throw new BadRequestException('At least one rehearsal ID must be provided');
    }

    const results = {
      success: 0,
      errors: [] as Array<{ rehearsalId: number; error: string }>
    };

    // Process each rehearsal
    for (const rehearsalId of rehearsalIds) {
      try {
        // Validate rehearsal status before attempting promotion
        const rehearsal = await this.rehearsalService.findOne(rehearsalId);
        if (rehearsal.status !== 'Completed') {
          throw new BadRequestException(`Rehearsal ${rehearsalId} must be completed before promotion. Current status: ${rehearsal.status}`);
        }
        
        await this.promoteRehearsal(rehearsalId, userId, userType, userRole);
        results.success++;
      } catch (error) {
        results.errors.push({
          rehearsalId,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    }

    return results;
  }

  /**
   * Replace all performance songs with rehearsal songs (clears existing and adds new)
   */
  async replaceRehearsal(
    rehearsalId: number, 
    userId: number, 
    userType: string, 
    userRole?: string
  ): Promise<Performance> {
    // Check permissions
    const isSuperAdmin = userType === 'admin' && userRole === AdminRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (user.categories?.includes(UserCategory.LEAD)) {
        await this.leadershipShiftService.checkUserOnActiveShift(userId);
      } else {
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can replace rehearsals');
      }
    }

    // Get the rehearsal with all its details first
    const rehearsal = await this.rehearsalService.findOne(rehearsalId);
    
    // Validate rehearsal status - only completed rehearsals can be promoted
    if (rehearsal.status !== 'Completed') {
      throw new BadRequestException(`Rehearsal ${rehearsalId} must be completed before promotion. Current status: ${rehearsal.status}`);
    }
    
    // Get the performance ID from the rehearsal
    const performanceId = rehearsal.performanceId;
    
    if (!performanceId) {
      throw new BadRequestException(`Rehearsal ${rehearsalId} is not linked to any performance`);
    }
    
    // Get the performance
    const performance = await this.findOne(performanceId);
    
    // Check if performance is in preparation status
    if (performance.status !== PerformanceStatus.IN_PREPARATION) {
      throw new BadRequestException(`Performance must be in 'in_preparation' status to replace with rehearsal. Current status: ${performance.status}`);
    }
    
    // Use a transaction to ensure data consistency
    return await this.performanceRepository.manager.transaction(async (transactionalEntityManager) => {
      // Validate performanceId is a valid number
      if (!Number.isInteger(performanceId) || performanceId <= 0) {
        throw new BadRequestException(`Invalid performanceId: ${performanceId}. Must be a positive integer.`);
      }

      // Delete all existing performance songs and related data
      const existingSongs = await transactionalEntityManager.find(PerformanceSong, { 
        where: { performanceId } 
      });
      
      const existingSongIds = existingSongs.map(song => song.id);

      if (existingSongIds.length > 0) {
        // Delete related musicians
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from(PerformanceSongMusician)
          .where('"performanceSongId" IN (:...songIds)', { songIds: existingSongIds })
          .execute();

        // Delete related voice parts
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from(PerformanceVoicePart)
          .where('"performanceSongId" IN (:...songIds)', { songIds: existingSongIds })
          .execute();

        // Delete the performance songs
        await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from(PerformanceSong)
          .where('id IN (:...songIds)', { songIds: existingSongIds })
          .execute();
      }

      // Check if rehearsal has songs
      if (!rehearsal.rehearsalSongs || rehearsal.rehearsalSongs.length === 0) {
        throw new BadRequestException('Rehearsal must contain at least one song to replace');
      }

      // Add all rehearsal songs (no duplicate checking since we cleared existing)
      for (const rehearsalSong of rehearsal.rehearsalSongs) {
        // Validate rehearsal song has required data
        if (!rehearsalSong.song || !rehearsalSong.song.id) {
          throw new BadRequestException('Rehearsal song must have a valid song reference');
        }

        // Create performance song
        const performanceSong = transactionalEntityManager.create(PerformanceSong, {
          performanceId: performanceId,
          songId: rehearsalSong.song.id,
          leadSingerId: rehearsalSong.leadSinger?.[0]?.id,
          notes: rehearsalSong.notes,
          order: rehearsalSong.order,
          timeAllocated: rehearsalSong.timeAllocated,
          focusPoints: rehearsalSong.focusPoints,
          musicalKey: rehearsalSong.musicalKey,
        });
        
        const savedPerformanceSong = await transactionalEntityManager.save(performanceSong);

        // Copy musicians
        if (rehearsalSong.musicians && rehearsalSong.musicians.length > 0) {
          for (const musician of rehearsalSong.musicians) {
            const performanceMusician = transactionalEntityManager.create(PerformanceSongMusician, {
              performanceSongId: savedPerformanceSong.id,
              userId: musician.user?.id,
              instrument: this.mapInstrumentToEnum(musician.instrument),
              notes: musician.notes,
              practiceNotes: musician.practiceNotes,
              needsPractice: musician.needsPractice,
              isSoloist: musician.isSoloist,
              isAccompanist: musician.isAccompanist,
              soloStartTime: musician.soloStartTime,
              soloEndTime: musician.soloEndTime,
              soloNotes: musician.soloNotes,
              accompanimentNotes: musician.accompanimentNotes,
              order: musician.order,
              timeAllocated: musician.timeAllocated,
            });

            await transactionalEntityManager.save(performanceMusician);
          }
        }

        // Copy voice parts
        if (rehearsalSong.voiceParts && rehearsalSong.voiceParts.length > 0) {
          for (const voicePart of rehearsalSong.voiceParts) {
            const performanceVoicePart = transactionalEntityManager.create(PerformanceVoicePart, {
              performanceSongId: savedPerformanceSong.id,
              type: voicePart.voicePartType,
              needsWork: voicePart.needsWork,
              focusPoints: voicePart.focusPoints,
              notes: voicePart.notes,
              order: voicePart.order,
              timeAllocated: voicePart.timeAllocated,
            });

            const savedPerformanceVoicePart = await transactionalEntityManager.save(performanceVoicePart);

            // Copy voice part members
            if (voicePart.members && voicePart.members.length > 0) {
              const memberInserts = voicePart.members.map(member => ({
                performanceVoicePartId: savedPerformanceVoicePart.id,
                userId: member.id
              }));

              if (memberInserts.length > 0) {
                await transactionalEntityManager
                  .createQueryBuilder()
                  .insert()
                  .into('performance_voice_part_members')
                  .values(memberInserts)
                  .execute();
              }
            }
          }
        }
      }

      // Return the performance without changing its status
      return this.findOne(performanceId);
    });
  }

  /**
   * Promote a rehearsal to populate the performance with detailed data
   * This method copies all the detailed information from a rehearsal to the performance
   * Songs are added to the performance, duplicates are skipped
   */
  async promoteRehearsal(
    rehearsalId: number, 
    userId: number, 
    userType: string, 
    userRole?: string
  ): Promise<Performance> {

    // Check permissions
    const isSuperAdmin = userType === 'admin' && userRole === AdminRole.SUPER_ADMIN;
    
    if (!isSuperAdmin) {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (user.categories?.includes(UserCategory.LEAD)) {
        await this.leadershipShiftService.checkUserOnActiveShift(userId);
      } else {
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can promote rehearsals');
      }
    }

    // Get the rehearsal with all its details first
    const rehearsal = await this.rehearsalService.findOne(rehearsalId);
    
    // Validate rehearsal status - only completed rehearsals can be promoted
    if (rehearsal.status !== 'Completed') {
      throw new BadRequestException(`Rehearsal ${rehearsalId} must be completed before promotion. Current status: ${rehearsal.status}`);
    }
    
    // Get the performance ID from the rehearsal
    const performanceId = rehearsal.performanceId;
    
    if (!performanceId) {
      throw new BadRequestException(`Rehearsal ${rehearsalId} is not linked to any performance`);
    }
    
    // Get the performance
    const performance = await this.findOne(performanceId);
    
    // Check if performance is in preparation status
    if (performance.status !== PerformanceStatus.IN_PREPARATION) {
      throw new BadRequestException(`Performance must be in 'in_preparation' status to promote a rehearsal. Current status: ${performance.status}`);
    }
    
    // Use a transaction to ensure data consistency
    return await this.performanceRepository.manager.transaction(async (transactionalEntityManager) => {
      // Validate performanceId is a valid number
      if (!Number.isInteger(performanceId) || performanceId <= 0) {
        throw new BadRequestException(`Invalid performanceId: ${performanceId}. Must be a positive integer.`);
      }

      // Check for duplicate songs to avoid adding the same song twice
      const existingSongs = await transactionalEntityManager.find(PerformanceSong, { 
        where: { performanceId } 
      });
      
      const existingSongIds = new Set(existingSongs.map(song => song.songId));

    // Check if rehearsal has songs
    if (!rehearsal.rehearsalSongs || rehearsal.rehearsalSongs.length === 0) {
      throw new BadRequestException('Rehearsal must contain at least one song to promote');
    }

    for (const rehearsalSong of rehearsal.rehearsalSongs) {
      // Validate rehearsal song has required data
      if (!rehearsalSong.song || !rehearsalSong.song.id) {
        throw new BadRequestException('Rehearsal song must have a valid song reference');
      }

      // Skip if this song already exists in the performance
      if (existingSongIds.has(rehearsalSong.song.id)) {
        continue;
      }

      // Create performance song using entity manager to avoid conflicts
      const performanceSong = transactionalEntityManager.create(PerformanceSong, {
        performanceId: performanceId,
        songId: rehearsalSong.song.id,
        leadSingerId: rehearsalSong.leadSinger?.[0]?.id,
        notes: rehearsalSong.notes,
        order: rehearsalSong.order,
        timeAllocated: rehearsalSong.timeAllocated,
        focusPoints: rehearsalSong.focusPoints,
        musicalKey: rehearsalSong.musicalKey,
      });
      
      const savedPerformanceSong = await transactionalEntityManager.save(performanceSong);

      // Copy musicians
      if (rehearsalSong.musicians && rehearsalSong.musicians.length > 0) {
        for (const musician of rehearsalSong.musicians) {
          const performanceMusician = transactionalEntityManager.create(PerformanceSongMusician, {
            performanceSongId: savedPerformanceSong.id,
            userId: musician.user?.id,
            instrument: this.mapInstrumentToEnum(musician.instrument),
            notes: musician.notes,
            practiceNotes: musician.practiceNotes,
            needsPractice: musician.needsPractice,
            isSoloist: musician.isSoloist,
            isAccompanist: musician.isAccompanist,
            soloStartTime: musician.soloStartTime,
            soloEndTime: musician.soloEndTime,
            soloNotes: musician.soloNotes,
            accompanimentNotes: musician.accompanimentNotes,
            order: musician.order,
            timeAllocated: musician.timeAllocated,
          });

          await transactionalEntityManager.save(performanceMusician);
        }
      }

      // Copy voice parts
      if (rehearsalSong.voiceParts && rehearsalSong.voiceParts.length > 0) {
        for (const voicePart of rehearsalSong.voiceParts) {
          const performanceVoicePart = transactionalEntityManager.create(PerformanceVoicePart, {
            performanceSongId: savedPerformanceSong.id,
            type: voicePart.voicePartType,
            needsWork: voicePart.needsWork,
            focusPoints: voicePart.focusPoints,
            notes: voicePart.notes,
            order: voicePart.order,
            timeAllocated: voicePart.timeAllocated,
          });

          const savedPerformanceVoicePart = await transactionalEntityManager.save(performanceVoicePart);

          // Copy voice part members
          if (voicePart.members && voicePart.members.length > 0) {
            // Insert members into junction table
            const memberInserts = voicePart.members.map(member => ({
              performanceVoicePartId: savedPerformanceVoicePart.id,
              userId: member.id
            }));

            if (memberInserts.length > 0) {
              await transactionalEntityManager
                .createQueryBuilder()
                .insert()
                .into('performance_voice_part_members')
                .values(memberInserts)
                .execute();
            }
          }
        }
      }
    }

      // Return the performance without changing its status
      // Let the user manually update the status when ready
      return this.findOne(performanceId);
    });
  }

  /**
   * Get rehearsals that can be promoted (completed rehearsals linked to performances in preparation status)
   */
  async getPromotableRehearsals(): Promise<Array<{ id: number; title: string; performanceId: number; performanceTitle: string; rehearsalDate: Date; status: string }>> {
    const rehearsals = await this.rehearsalService.findAll({
      page: 1,
      limit: 1000, // Get all rehearsals
      status: 'completed' as any // Only completed rehearsals can be promoted
    });

    const promotableRehearsals = [];

    for (const rehearsal of rehearsals[0]) {
      // Double-check that rehearsal is completed
      if (rehearsal.status !== 'Completed') {
        continue;
      }
      
      if (rehearsal.performanceId) {
        try {
          const performance = await this.findOne(rehearsal.performanceId);
          if (performance.status === PerformanceStatus.IN_PREPARATION) {
            promotableRehearsals.push({
              id: rehearsal.id,
              title: rehearsal.title || `Rehearsal ${rehearsal.id}`,
              performanceId: rehearsal.performanceId,
              performanceTitle: performance.location || `Performance ${rehearsal.performanceId}`,
              rehearsalDate: rehearsal.date,
              status: rehearsal.status
            });
          }
        } catch (error) {
          // Skip rehearsals linked to non-existent performances
          continue;
        }
      }
    }

    return promotableRehearsals;
  }

} 