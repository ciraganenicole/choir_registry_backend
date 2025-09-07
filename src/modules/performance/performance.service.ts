import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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

    // CRITICAL: Validate that there's only one active shift before creating performance
    const { isValid, activeShifts } = await this.validateSingleActiveShift();
    if (!isValid) {
      throw new BadRequestException(
        `Cannot create performance. There are ${activeShifts.length} active shifts, but only one can be active at a time. ` +
        `Please resolve the shift conflicts before creating performances.`
      );
    }

    // Verify shift lead exists
    const shiftLead = await this.userRepository.findOneBy({ id: createPerformanceDto.shiftLeadId });
    if (!shiftLead) {
      throw new NotFoundException(`Shift lead with ID ${createPerformanceDto.shiftLeadId} not found`);
    }

    // Create performance
    const performance = this.performanceRepository.create({
      date: new Date(createPerformanceDto.date),
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
    const { page = 1, limit = 10, search, type, status, startDate, endDate, shiftLeadId } = filterDto;
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

    if (startDate && endDate) {
      queryBuilder.andWhere('performance.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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
      performance.date = new Date(updatePerformanceDto.date);
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
    if (updatePerformanceDto.shiftLeadId) {
      const shiftLead = await this.userRepository.findOneBy({ id: updatePerformanceDto.shiftLeadId });
      if (!shiftLead) {
        throw new BadRequestException(`Shift lead with ID ${updatePerformanceDto.shiftLeadId} not found`);
      }
      performance.shiftLeadId = updatePerformanceDto.shiftLeadId;
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
   * Promote a rehearsal to populate the performance with detailed data
   * This method copies all the detailed information from a rehearsal to the performance
   */
  async promoteRehearsal(
    performanceId: number, 
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

    // Get the performance
    const performance = await this.findOne(performanceId);
    
    // Check if performance is in preparation status
    if (performance.status !== PerformanceStatus.IN_PREPARATION) {
      throw new BadRequestException(`Performance must be in 'in_preparation' status to promote a rehearsal. Current status: ${performance.status}`);
    }

    // Get the rehearsal with all its details
    const rehearsal = await this.rehearsalService.findOne(rehearsalId);
    
    // Verify the rehearsal belongs to this performance
    if (rehearsal.performanceId !== performanceId) {
      throw new BadRequestException(`Rehearsal ${rehearsalId} does not belong to performance ${performanceId}`);
    }

    // Use a transaction to ensure data consistency
    return await this.performanceRepository.manager.transaction(async (transactionalEntityManager) => {
      // First, let's check what existing performance songs exist
      const existingSongs = await transactionalEntityManager.find(PerformanceSong, { 
        where: { performanceId } 
      });
      // Get the IDs of existing performance songs first
      const existingSongIds = existingSongs.map(song => song.id);

      if (existingSongIds.length > 0) {
        // Delete related musicians
        const relatedMusicians = await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from(PerformanceSongMusician)
          .where('"performanceSongId" IN (:...songIds)', { songIds: existingSongIds })
          .execute();

        // Delete related voice parts
        const relatedVoiceParts = await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from(PerformanceVoicePart)
          .where('"performanceSongId" IN (:...songIds)', { songIds: existingSongIds })
          .execute();

        // Delete the performance songs
        const deletedCount = await transactionalEntityManager
          .createQueryBuilder()
          .delete()
          .from(PerformanceSong)
          .where('id IN (:...songIds)', { songIds: existingSongIds })
          .execute();
      } else {
        console.log('ℹ️ No existing performance songs to delete');
      }

    for (const rehearsalSong of rehearsal.rehearsalSongs) {

      // Validate performanceId before creating entity
      if (!performanceId || performanceId === undefined || performanceId === null) {
        throw new Error(`Invalid performanceId: ${performanceId}`);
      }

      // Create performance song - ensure no ID is passed to avoid update conflicts
      const performanceSongData = {
        performanceId: performanceId, // Explicitly use the parameter
        songId: rehearsalSong.song.id,
        leadSingerId: rehearsalSong.leadSinger?.[0]?.id,
        notes: rehearsalSong.notes,
        order: rehearsalSong.order,
        timeAllocated: rehearsalSong.timeAllocated,
        focusPoints: rehearsalSong.focusPoints,
        musicalKey: rehearsalSong.musicalKey,
      };
      // Ensure no ID is present in the data to avoid update conflicts
      const cleanPerformanceSongData = { ...performanceSongData };
      delete (cleanPerformanceSongData as any).id; // Remove any potential ID field

      // Use insert instead of create/save to avoid any ID conflicts
      const insertResult = await transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(PerformanceSong)
        .values(cleanPerformanceSongData)
        .returning('*')
        .execute();
      
      const savedPerformanceSong = insertResult.raw[0];

      // Copy musicians
      if (rehearsalSong.musicians && rehearsalSong.musicians.length > 0) {
        for (const musician of rehearsalSong.musicians) {
          const musicianData = {
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
          };

          await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(PerformanceSongMusician)
            .values(musicianData)
            .execute();
        }
      }

      // Copy voice parts
      if (rehearsalSong.voiceParts && rehearsalSong.voiceParts.length > 0) {
        for (const voicePart of rehearsalSong.voiceParts) {
          const voicePartData = {
            performanceSongId: savedPerformanceSong.id,
            type: voicePart.voicePartType,
            needsWork: voicePart.needsWork,
            focusPoints: voicePart.focusPoints,
            notes: voicePart.notes,
            order: voicePart.order,
            timeAllocated: voicePart.timeAllocated,
          };

          const insertResult = await transactionalEntityManager
            .createQueryBuilder()
            .insert()
            .into(PerformanceVoicePart)
            .values(voicePartData)
            .returning('*')
            .execute();

          const savedPerformanceVoicePart = insertResult.raw[0];

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

      // Update performance status to ready
      performance.status = PerformanceStatus.READY;
      await transactionalEntityManager.save(Performance, performance);

      return this.findOne(performanceId);
    });
  }

  private async validateSingleActiveShift(): Promise<{ isValid: boolean; activeShifts: LeadershipShift[] }> {
    try {
      const activeShifts = await this.leadershipShiftRepository.find({
        where: { status: ShiftStatus.ACTIVE },
      });

      if (activeShifts.length > 1) {
        return { isValid: false, activeShifts };
      }
      return { isValid: true, activeShifts: [] };
    } catch (error) {
      return { isValid: true, activeShifts: [] };
    }
  }
} 