import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Rehearsal, RehearsalType, RehearsalStatus } from './rehearsal.entity';
import { RehearsalSong } from './rehearsal-song.entity';
import { RehearsalSongMusician } from './rehearsal-song-musician.entity';
import { RehearsalVoicePart } from './rehearsal-voice-part.entity';
import { Song } from '../song/song.entity';
import { User } from '../users/user.entity';
import { UserCategory } from '../users/enums/user-category.enum';
import { AdminRole } from '../admin/admin-role.enum';
import { LeadershipShift, ShiftStatus } from '../leadership-shift/leadership-shift.entity';
import { LeadershipShiftService } from '../leadership-shift/leadership-shift.service';
import { CreateRehearsalDto } from './dto/create-rehearsal.dto';
import { CreateRehearsalSongDto } from './dto/create-rehearsal-song.dto';
import { UpdateRehearsalSongDto } from './dto/update-rehearsal-song.dto';
import { UpdateRehearsalDto } from './dto/update-rehearsal.dto';
import { RehearsalFilterDto } from './dto/rehearsal-filter.dto';
import { Performance } from '../performance/performance.entity';

export interface RehearsalStats {
  totalRehearsals: number;
  completedRehearsals: number;
  upcomingRehearsals: number;
  byType: Record<RehearsalType, number>;
  byStatus: Record<RehearsalStatus, number>;
  byMonth: Record<string, number>;
}

@Injectable()
export class RehearsalService {
  constructor(
    @InjectRepository(Rehearsal)
    private readonly rehearsalRepository: Repository<Rehearsal>,
    @InjectRepository(RehearsalSong)
    private readonly rehearsalSongRepository: Repository<RehearsalSong>,
    @InjectRepository(RehearsalSongMusician)
    private readonly rehearsalSongMusicianRepository: Repository<RehearsalSongMusician>,
    @InjectRepository(RehearsalVoicePart)
    private readonly rehearsalVoicePartRepository: Repository<RehearsalVoicePart>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LeadershipShift)
    private readonly leadershipShiftRepository: Repository<LeadershipShift>,
    @InjectRepository(Performance)
    private readonly performanceRepository: Repository<Performance>,
    private readonly leadershipShiftService: LeadershipShiftService,
  ) {}

  async create(createRehearsalDto: CreateRehearsalDto, userId: number, userType: string, userRole?: string): Promise<Rehearsal> {
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
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can create rehearsals');
      }
    }

    // CRITICAL: Ensure there's a current active shift before creating rehearsal
    const currentActiveShift = await this.leadershipShiftService.getCurrentActiveShift();
    if (!currentActiveShift) {
      throw new BadRequestException(
        `Cannot create rehearsal. No active leadership shift found. ` +
        `Please ensure there's an active shift before creating rehearsals.`
      );
    }

    // Verify performance exists and belongs to the current active shift
    const performance = await this.performanceRepository.findOneBy({ id: createRehearsalDto.performanceId });
    if (!performance) {
      throw new NotFoundException(`Performance with ID ${createRehearsalDto.performanceId} not found`);
    }

    // Verify rehearsal lead exists if provided
    if (createRehearsalDto.rehearsalLeadId) {
      const rehearsalLead = await this.userRepository.findOneBy({ id: createRehearsalDto.rehearsalLeadId });
      if (!rehearsalLead) {
        throw new NotFoundException(`Rehearsal lead with ID ${createRehearsalDto.rehearsalLeadId} not found`);
      }
    }

    // Create rehearsal with smart defaults
    const rehearsal = this.rehearsalRepository.create({
      ...createRehearsalDto,
      date: new Date(createRehearsalDto.date),
      // If no rehearsal lead specified, default to the performance's shift lead
      rehearsalLeadId: createRehearsalDto.rehearsalLeadId || performance.shiftLeadId,
      // Set the createdById to the current user
      createdById: userId,
    });

    // Save the rehearsal first to get the ID
    const savedRehearsal = await this.rehearsalRepository.save(rehearsal);

    // Handle choir members if provided
    if (createRehearsalDto.choirMemberIds && createRehearsalDto.choirMemberIds.length > 0) {
      const choirMembers = await this.userRepository.findBy({ id: In(createRehearsalDto.choirMemberIds) });
      savedRehearsal.choirMembers = choirMembers;
      await this.rehearsalRepository.save(savedRehearsal);
    }

    // Handle rehearsal songs if provided
    if (createRehearsalDto.rehearsalSongs && createRehearsalDto.rehearsalSongs.length > 0) {
      for (const songDto of createRehearsalDto.rehearsalSongs) {
        // Verify song exists
        const song = await this.songRepository.findOneBy({ id: songDto.songId });
        if (!song) {
          throw new NotFoundException(`Song with ID ${songDto.songId} not found`);
        }

        // Create rehearsal song
        const rehearsalSong = this.rehearsalSongRepository.create({
          rehearsal: { id: savedRehearsal.id } as Rehearsal,
          song: { id: songDto.songId } as Song,
          difficulty: songDto.difficulty,
          needsWork: songDto.needsWork || false,
          order: songDto.order || 1,
          timeAllocated: songDto.timeAllocated,
          focusPoints: songDto.focusPoints,
          notes: songDto.notes,
          musicalKey: songDto.musicalKey,
        });

        const savedRehearsalSong = await this.rehearsalSongRepository.save(rehearsalSong);

        // Handle lead singers for this song
        if (songDto.leadSingerIds && songDto.leadSingerIds.length > 0) {
          const leadSingers = await this.userRepository.findBy({ id: In(songDto.leadSingerIds) });
          savedRehearsalSong.leadSinger = leadSingers;
          await this.rehearsalSongRepository.save(savedRehearsalSong);
        }

        // Handle chorus members for this song
        if (songDto.chorusMemberIds && songDto.chorusMemberIds.length > 0) {
          const chorusMembers = await this.userRepository.findBy({ id: In(songDto.chorusMemberIds) });
          savedRehearsalSong.chorusMembers = chorusMembers;
          await this.rehearsalSongRepository.save(savedRehearsalSong);
        }

        // Handle musicians for this song
        if (songDto.musicians && songDto.musicians.length > 0) {
          for (const musicianDto of songDto.musicians) {
            const musician = this.rehearsalSongMusicianRepository.create({
              rehearsalSong: { id: savedRehearsalSong.id } as RehearsalSong,
              user: { id: musicianDto.userId } as User,
              instrument: musicianDto.instrument,
              notes: musicianDto.notes,
              practiceNotes: musicianDto.practiceNotes,
              needsPractice: musicianDto.needsPractice || false,
              isSoloist: musicianDto.isSoloist || false,
              isAccompanist: musicianDto.isAccompanist || false,
              soloStartTime: musicianDto.soloStartTime,
              soloEndTime: musicianDto.soloEndTime,
              soloNotes: musicianDto.soloNotes,
              accompanimentNotes: musicianDto.accompanimentNotes,
              order: musicianDto.order || 1,
              timeAllocated: musicianDto.timeAllocated,
            });

            await this.rehearsalSongMusicianRepository.save(musician);
          }
        }

        // Handle voice parts for this song
        if (songDto.voiceParts && songDto.voiceParts.length > 0) {
          for (const voicePartDto of songDto.voiceParts) {
                         const voicePart = this.rehearsalVoicePartRepository.create({
               rehearsalSong: { id: savedRehearsalSong.id } as RehearsalSong,
               voicePartType: voicePartDto.voicePartType,
              needsWork: voicePartDto.needsWork || false,
              focusPoints: voicePartDto.focusPoints,
              notes: voicePartDto.notes,
              order: voicePartDto.order || 1,
              timeAllocated: voicePartDto.timeAllocated,
            });

            const savedVoicePart = await this.rehearsalVoicePartRepository.save(voicePart);

            // Handle voice part members
            if (voicePartDto.memberIds && voicePartDto.memberIds.length > 0) {
              const members = await this.userRepository.findBy({ id: In(voicePartDto.memberIds) });
              savedVoicePart.members = members;
              await this.rehearsalVoicePartRepository.save(savedVoicePart);
            }
          }
        }
      }
    }

    return this.findOne(savedRehearsal.id);
  }

  async findAll(filterDto: RehearsalFilterDto): Promise<[Rehearsal[], number]> {
    const { page = 1, limit = 10, search, type, status, startDate, endDate, songId, shiftLeadId, isTemplate, performanceId } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.rehearsalRepository
      .createQueryBuilder('rehearsal')
      .leftJoinAndSelect('rehearsal.performance', 'performance')
      .leftJoinAndSelect('rehearsal.rehearsalLead', 'rehearsalLead')
      .leftJoinAndSelect('rehearsal.shiftLead', 'shiftLead')
      .leftJoinAndSelect('rehearsal.choirMembers', 'choirMembers')
      .leftJoinAndSelect('rehearsal.rehearsalSongs', 'rehearsalSongs')
      .leftJoinAndSelect('rehearsalSongs.song', 'song')
      .leftJoinAndSelect('rehearsalSongs.leadSinger', 'leadSinger')
      .leftJoinAndSelect('rehearsalSongs.chorusMembers', 'chorusMembers')
      .leftJoinAndSelect('rehearsalSongs.musicians', 'musicians')
      .leftJoinAndSelect('musicians.user', 'musicianUser')
      .leftJoinAndSelect('rehearsal.created_by', 'created_by');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(song.title) LIKE LOWER(:search) OR LOWER(song.composer) LIKE LOWER(:search) OR LOWER(rehearsal.title) LIKE LOWER(:search) OR LOWER(rehearsal.location) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    if (type) {
      queryBuilder.andWhere('rehearsal.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('rehearsal.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('rehearsal.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    if (songId) {
      queryBuilder.andWhere('rehearsalSongs.songId = :songId', { songId });
    }

    if (shiftLeadId) {
      queryBuilder.andWhere('rehearsal.shiftLeadId = :shiftLeadId', { shiftLeadId });
    }

    if (isTemplate !== undefined) {
      queryBuilder.andWhere('rehearsal.isTemplate = :isTemplate', { isTemplate });
    }

    if (performanceId) {
      queryBuilder.andWhere('rehearsal.performanceId = :performanceId', { performanceId });
    }

    // Order by date (newest first)
    queryBuilder.orderBy('rehearsal.date', 'DESC');

    queryBuilder.skip(skip).take(limit);

    try {
      const result = await queryBuilder.getManyAndCount();
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number): Promise<Rehearsal> {
    
    try {
      const rehearsal = await this.rehearsalRepository.findOne({
        where: { id },
        relations: [
          'performance',
          'rehearsalLead',
          'shiftLead',
          'choirMembers',
          'rehearsalSongs',
          'rehearsalSongs.song',
          'rehearsalSongs.leadSinger',
          'rehearsalSongs.chorusMembers',
          'rehearsalSongs.musicians',
          'rehearsalSongs.musicians.user',
          'rehearsalSongs.voiceParts',
          'rehearsalSongs.voiceParts.members',
          'created_by',
        ],
        order: {
          rehearsalSongs: {
            order: 'ASC',
          },
        },
      });

      if (!rehearsal) {
        throw new NotFoundException(`Rehearsal with ID ${id} not found`);
      }
      
      return rehearsal;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateRehearsalDto: UpdateRehearsalDto, userId: number, userType: string, userRole?: string): Promise<Rehearsal> {
    const rehearsal = await this.findOne(id);

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
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can update rehearsals');
      }
    }

    // Check if user has permission to update (either SUPER_ADMIN or the creator)
    if (rehearsal.createdById !== userId && !isSuperAdmin) {
      throw new ForbiddenException('You can only update rehearsals you created');
    }

    // Update basic fields
    if (updateRehearsalDto.title !== undefined) {
      rehearsal.title = updateRehearsalDto.title;
    }
    if (updateRehearsalDto.date) {
      rehearsal.date = new Date(updateRehearsalDto.date);
    }
    if (updateRehearsalDto.type) {
      rehearsal.type = updateRehearsalDto.type;
    }
    if (updateRehearsalDto.status) {
      rehearsal.status = updateRehearsalDto.status;
    }
    if (updateRehearsalDto.location !== undefined) {
      rehearsal.location = updateRehearsalDto.location;
    }
    if (updateRehearsalDto.duration !== undefined) {
      rehearsal.duration = updateRehearsalDto.duration;
    }
    if (updateRehearsalDto.performanceId !== undefined) {
      rehearsal.performanceId = updateRehearsalDto.performanceId;
    }
    if (updateRehearsalDto.rehearsalLeadId !== undefined) {
      rehearsal.rehearsalLeadId = updateRehearsalDto.rehearsalLeadId;
    }
    if (updateRehearsalDto.isTemplate !== undefined) {
      rehearsal.isTemplate = updateRehearsalDto.isTemplate;
    }
    if (updateRehearsalDto.notes !== undefined) {
      rehearsal.notes = updateRehearsalDto.notes;
    }
    if (updateRehearsalDto.objectives !== undefined) {
      rehearsal.objectives = updateRehearsalDto.objectives;
    }
    if (updateRehearsalDto.feedback !== undefined) {
      rehearsal.feedback = updateRehearsalDto.feedback;
    }

    // Update relationships if provided
    if (updateRehearsalDto.shiftLeadId) {
      const shiftLead = await this.userRepository.findOneBy({ id: updateRehearsalDto.shiftLeadId });
      if (!shiftLead) {
        throw new BadRequestException(`Shift lead with ID ${updateRehearsalDto.shiftLeadId} not found`);
      }
      rehearsal.shiftLeadId = updateRehearsalDto.shiftLeadId;
    }

    if (updateRehearsalDto.choirMemberIds) {
      const choirMembers = await this.userRepository.findBy({ id: In(updateRehearsalDto.choirMemberIds) });
      rehearsal.choirMembers = choirMembers;
    }

    // Save the updated rehearsal
    await this.rehearsalRepository.save(rehearsal);

    return this.findOne(id);
  }

  async remove(id: number, userId: number, userType: string, userRole?: string): Promise<void> {
    const rehearsal = await this.findOne(id);

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
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can delete rehearsals');
      }
    }

    // Check if user has permission to delete (either SUPER_ADMIN or the creator)
    if (rehearsal.createdById !== userId && !isSuperAdmin) {
      throw new ForbiddenException('You can only delete rehearsals you created');
    }

    await this.rehearsalRepository.remove(rehearsal);
  }

  async findByUser(userId: number): Promise<Rehearsal[]> {
    
    try {
      const rehearsals = await this.rehearsalRepository.find({
        where: [
          { createdById: userId },
          { shiftLeadId: userId },
          { rehearsalLeadId: userId },
        ],
        relations: [
          'performance',
          'rehearsalLead',
          'shiftLead',
          'choirMembers',
          'rehearsalSongs',
          'rehearsalSongs.song',
          'rehearsalSongs.leadSinger',
          'rehearsalSongs.chorusMembers',
          'rehearsalSongs.musicians',
          'rehearsalSongs.musicians.user',
          'rehearsalSongs.voiceParts',
          'rehearsalSongs.voiceParts.members',
          'created_by',
        ],
        order: { date: 'DESC' },
      });
      
      return rehearsals;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Debug method to get all rehearsals without any filters
   */
  async getAllRehearsalsDebug(): Promise<Rehearsal[]> {
    
    try {
      // Simple query without complex joins for debugging
      const rehearsals = await this.rehearsalRepository.find({
        relations: ['performance', 'rehearsalLead', 'shiftLead'],
        order: { date: 'DESC' },
      });
      
      if (rehearsals.length > 0) {
        rehearsals.forEach((rehearsal, index) => {
        });
      } else {
        console.log('⚠️  No rehearsals found in database at all');
      }
      
      return rehearsals;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Raw database query to check rehearsals table directly
   */
  async getRawRehearsalsDebug(): Promise<any[]> {
    
    try {
      // Use query builder for raw query
      const rawRehearsals = await this.rehearsalRepository
        .createQueryBuilder('rehearsal')
        .select([
          'rehearsal.id',
          'rehearsal.title',
          'rehearsal.date',
          'rehearsal.type',
          'rehearsal.status',
          'rehearsal.performanceId',
          'rehearsal.rehearsalLeadId',
          'rehearsal.shiftLeadId',
          'rehearsal.createdById'
        ])
        .getRawMany();
      if (rawRehearsals.length > 0) {
        rawRehearsals.forEach((rehearsal, index) => {
        });
      } else {
        console.log('⚠️  No raw rehearsals found in database');
      }
      
      return rawRehearsals;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get rehearsal songs with clear separation of song library and rehearsal data
   */
  async getRehearsalSongs(rehearsalId: number): Promise<any> {
    
    try {
      const rehearsal = await this.findOne(rehearsalId);
      
      const result = {
        rehearsalInfo: {
          id: rehearsal.id,
          title: rehearsal.title,
          date: rehearsal.date,
          type: rehearsal.type,
          status: rehearsal.status,
          performanceId: rehearsal.performanceId,
          rehearsalLeadId: rehearsal.rehearsalLeadId,
          shiftLeadId: rehearsal.shiftLeadId,
          location: rehearsal.location,
          duration: rehearsal.duration,
          notes: rehearsal.notes,
          objectives: rehearsal.objectives,
          isTemplate: rehearsal.isTemplate
        },
        rehearsalSongs: rehearsal.rehearsalSongs?.map(song => ({
          rehearsalSongId: song.id,
          // Song library info (read-only, general song data)
          songLibrary: {
            id: song.song.id,
            title: song.song.title,
            composer: song.song.composer,
            genre: song.song.genre,
            difficulty: song.song.difficulty,
            status: song.song.status,
            lyrics: song.song.lyrics,
            times_performed: song.song.times_performed,
            last_performed: song.song.last_performed,
            created_at: song.song.created_at,
            updated_at: song.song.updated_at,
            addedById: song.song.addedById
          },
          // Rehearsal-specific info (editable, rehearsal context)
          rehearsalDetails: {
            difficulty: song.difficulty,
            needsWork: song.needsWork,
            order: song.order,
            timeAllocated: song.timeAllocated,
            focusPoints: song.focusPoints,
            notes: song.notes,
            musicalKey: song.musicalKey,
            // Lead singers for this rehearsal
            leadSinger: song.leadSinger?.map(singer => ({
              id: singer.id,
              firstName: singer.firstName,
              lastName: singer.lastName,
              email: singer.email
            })) || [],
            // Musicians assigned for this rehearsal
            musicians: song.musicians?.map(musician => ({
              id: musician.id,
              user: {
                id: musician.user.id,
                firstName: musician.user.firstName,
                lastName: musician.user.lastName,
                email: musician.user.email
              },
              instrument: musician.instrument,
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
              timeAllocated: musician.timeAllocated
            })) || [],
            // Voice parts for this rehearsal
            voiceParts: song.voiceParts?.map(voicePart => ({
              id: voicePart.id,
              voicePartType: voicePart.voicePartType,
              needsWork: voicePart.needsWork,
              focusPoints: voicePart.focusPoints,
              notes: voicePart.notes,
              order: voicePart.order,
              timeAllocated: voicePart.timeAllocated,
              // Members assigned to this voice part
              members: voicePart.members?.map(member => ({
                id: member.id,
                firstName: member.firstName,
                lastName: member.lastName,
                email: member.email
              })) || []
            })) || [],
            // Chorus members for this rehearsal
            chorusMembers: song.chorusMembers?.map(member => ({
              id: member.id,
              firstName: member.firstName,
              lastName: member.lastName,
              email: member.email
            })) || []
          }
        })) || []
      };
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a rehearsal can be promoted to performance
   */
  async checkPromotionReadiness(rehearsalId: number): Promise<{
    canPromote: boolean;
    reasons: string[];
    performanceInfo?: any;
    rehearsalInfo: any;
    debug: any;
  }> {
    
    try {
      const rehearsal = await this.findOne(rehearsalId);
      const reasons: string[] = [];
      
      // Check if rehearsal has performanceId
      if (!rehearsal.performanceId) {
        reasons.push('Performance ID is required but missing');
        return {
          canPromote: false,
          reasons,
          rehearsalInfo: {
            id: rehearsal.id,
            title: rehearsal.title,
            performanceId: rehearsal.performanceId
          },
          debug: {
            rehearsalPerformanceId: rehearsal.performanceId,
            performanceExists: false,
            performanceStatus: 'NOT_FOUND',
            requiredStatus: 'in_preparation'
          }
        };
      }
      
      // Get performance info
      let performanceInfo = null;
      try {
        performanceInfo = await this.performanceRepository.findOne({
          where: { id: rehearsal.performanceId },
          select: ['id', 'status', 'date', 'location', 'type']
        });
      } catch (error) {
        reasons.push('Unable to fetch performance information');
      }
      
      if (!performanceInfo) {
        reasons.push(`Performance with ID ${rehearsal.performanceId} not found`);
        return {
          canPromote: false,
          reasons,
          rehearsalInfo: {
            id: rehearsal.id,
            title: rehearsal.title,
            performanceId: rehearsal.performanceId
          },
          debug: {
            rehearsalPerformanceId: rehearsal.performanceId,
            performanceExists: false,
            performanceStatus: 'NOT_FOUND',
            requiredStatus: 'in_preparation'
          }
        };
      }
      
      // Check performance status
      if (performanceInfo.status !== 'in_preparation') {
        reasons.push(`Performance must be in 'in_preparation' status. Current status: ${performanceInfo.status}`);
      }
      
      // Check if rehearsal has songs
      if (!rehearsal.rehearsalSongs || rehearsal.rehearsalSongs.length === 0) {
        reasons.push('Rehearsal must contain at least one song');
      }
      
      // Check if songs have voice parts (recommended but not required)
      const songsWithVoiceParts = rehearsal.rehearsalSongs?.filter(song => 
        song.voiceParts && song.voiceParts.length > 0
      ) || [];
      
      if (songsWithVoiceParts.length === 0) {
        reasons.push('No songs have voice parts assigned (recommended for better performance preparation)');
      }
      
      const canPromote = reasons.length === 0;
      
      return {
        canPromote,
        reasons,
        performanceInfo,
        rehearsalInfo: {
          id: rehearsal.id,
          title: rehearsal.title,
          performanceId: rehearsal.performanceId,
          songsCount: rehearsal.rehearsalSongs?.length || 0,
          songsWithVoiceParts: songsWithVoiceParts.length
        },
        // Additional debug info for frontend
        debug: {
          rehearsalPerformanceId: rehearsal.performanceId,
          performanceExists: !!performanceInfo,
          performanceStatus: performanceInfo?.status || 'NOT_FOUND',
          requiredStatus: 'in_preparation'
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add songs to an existing rehearsal
   */
  async addSongsToRehearsal(
    rehearsalId: number, 
    rehearsalSongs: CreateRehearsalSongDto[], 
    userId: number, 
    userType: string, 
    userRole?: string
  ): Promise<Rehearsal> {
    
    // Validate input
    if (!rehearsalSongs || !Array.isArray(rehearsalSongs)) {
      throw new BadRequestException('rehearsalSongs must be an array');
    }
    
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
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can add songs to rehearsals');
      }
    }

    // Get the existing rehearsal
    const rehearsal = await this.findOne(rehearsalId);
    
    // Check if user has permission to modify this rehearsal
    if (rehearsal.createdById !== userId && !isSuperAdmin) {
      throw new ForbiddenException('You can only add songs to rehearsals you created');
    }

    // Add each song to the rehearsal
    for (const songDto of rehearsalSongs) {
      // Verify song exists
      const song = await this.songRepository.findOneBy({ id: songDto.songId });
      if (!song) {
        throw new NotFoundException(`Song with ID ${songDto.songId} not found`);
      }

      // Create rehearsal song
      const rehearsalSong = this.rehearsalSongRepository.create({
        rehearsal: { id: rehearsalId } as Rehearsal,
        song: { id: songDto.songId } as Song,
        difficulty: songDto.difficulty,
        needsWork: songDto.needsWork || false,
        order: songDto.order || 1,
        timeAllocated: songDto.timeAllocated,
        focusPoints: songDto.focusPoints,
        notes: songDto.notes,
        musicalKey: songDto.musicalKey,
      });

      const savedRehearsalSong = await this.rehearsalSongRepository.save(rehearsalSong);

      // Handle lead singers for this song
      if (songDto.leadSingerIds && songDto.leadSingerIds.length > 0) {
        const leadSingers = await this.userRepository.findBy({ id: In(songDto.leadSingerIds) });
        savedRehearsalSong.leadSinger = leadSingers;
        await this.rehearsalSongRepository.save(savedRehearsalSong);
      }

      // Handle chorus members for this song
      if (songDto.chorusMemberIds && songDto.chorusMemberIds.length > 0) {
        const chorusMembers = await this.userRepository.findBy({ id: In(songDto.chorusMemberIds) });
        savedRehearsalSong.chorusMembers = chorusMembers;
        await this.rehearsalSongRepository.save(savedRehearsalSong);
      }

      // Handle musicians for this song
      if (songDto.musicians && songDto.musicians.length > 0) {
        for (const musicianDto of songDto.musicians) {
          const musician = this.rehearsalSongMusicianRepository.create({
            rehearsalSong: { id: savedRehearsalSong.id } as RehearsalSong,
            user: { id: musicianDto.userId } as User,
            instrument: musicianDto.instrument,
            notes: musicianDto.notes,
            practiceNotes: musicianDto.practiceNotes,
            needsPractice: musicianDto.needsPractice || false,
            isSoloist: musicianDto.isSoloist || false,
            isAccompanist: musicianDto.isAccompanist || false,
            soloStartTime: musicianDto.soloStartTime,
            soloEndTime: musicianDto.soloEndTime,
            soloNotes: musicianDto.soloNotes,
            accompanimentNotes: musicianDto.accompanimentNotes,
            order: musicianDto.order || 1,
            timeAllocated: musicianDto.timeAllocated,
          });

          await this.rehearsalSongMusicianRepository.save(musician);
        }
      }

      // Handle voice parts for this song
      if (songDto.voiceParts && songDto.voiceParts.length > 0) {
        for (const voicePartDto of songDto.voiceParts) {
          const voicePart = this.rehearsalVoicePartRepository.create({
            rehearsalSong: { id: savedRehearsalSong.id } as RehearsalSong,
            voicePartType: voicePartDto.voicePartType,
            needsWork: voicePartDto.needsWork || false,
            focusPoints: voicePartDto.focusPoints,
            notes: voicePartDto.notes,
            order: voicePartDto.order || 1,
            timeAllocated: voicePartDto.timeAllocated,
          });

          const savedVoicePart = await this.rehearsalVoicePartRepository.save(voicePart);

          // Handle voice part members
          if (voicePartDto.memberIds && voicePartDto.memberIds.length > 0) {
            const members = await this.userRepository.findBy({ id: In(voicePartDto.memberIds) });
            savedVoicePart.members = members;
            await this.rehearsalVoicePartRepository.save(savedVoicePart);
          }
        }
      }
    }
    
    // Return the updated rehearsal
    return this.findOne(rehearsalId);
  }

  async findBySong(songId: number): Promise<Rehearsal[]> {
    return this.rehearsalRepository.find({
             where: { rehearsalSongs: { song: { id: songId } } },
      relations: [
        'performance',
        'rehearsalLead',
        'shiftLead',
        'choirMembers',
        'rehearsalSongs',
        'rehearsalSongs.song',
        'rehearsalSongs.leadSinger',
        'rehearsalSongs.chorusMembers',
        'rehearsalSongs.musicians',
        'rehearsalSongs.musicians.user',
        'rehearsalSongs.voiceParts',
        'rehearsalSongs.voiceParts.members',
        'created_by',
      ],
      order: { date: 'DESC' },
    });
  }

  async getStats(): Promise<RehearsalStats> {
    const stats = await this.rehearsalRepository
      .createQueryBuilder('rehearsal')
      .select('COUNT(*)', 'totalRehearsals')
      .addSelect('SUM(CASE WHEN rehearsal.status = :completedStatus THEN 1 ELSE 0 END)', 'completedRehearsals')
      .addSelect('SUM(CASE WHEN rehearsal.status = :planningStatus OR rehearsal.status = :inProgressStatus THEN 1 ELSE 0 END)', 'upcomingRehearsals')
      .setParameter('completedStatus', RehearsalStatus.COMPLETED)
      .setParameter('planningStatus', RehearsalStatus.PLANNING)
      .setParameter('inProgressStatus', RehearsalStatus.IN_PROGRESS)
      .getRawOne();

    const typeStats = await this.rehearsalRepository
      .createQueryBuilder('rehearsal')
      .select('rehearsal.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('rehearsal.type')
      .getRawMany();

    const statusStats = await this.rehearsalRepository
      .createQueryBuilder('rehearsal')
      .select('rehearsal.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('rehearsal.status')
      .getRawMany();

    const monthlyStats = await this.rehearsalRepository
      .createQueryBuilder('rehearsal')
      .select('TO_CHAR(rehearsal.date, \'YYYY-MM\')', 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy('month')
      .orderBy('month', 'DESC')
      .limit(12)
      .getRawMany();

    return {
      totalRehearsals: parseInt(stats.totalRehearsals) || 0,
      completedRehearsals: parseInt(stats.completedRehearsals) || 0,
      upcomingRehearsals: parseInt(stats.upcomingRehearsals) || 0,
      byType: typeStats.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {} as Record<RehearsalType, number>),
      byStatus: statusStats.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {} as Record<RehearsalStatus, number>),
      byMonth: monthlyStats.reduce((acc, item) => {
        acc[item.month] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async getTemplates(): Promise<Rehearsal[]> {
    return this.rehearsalRepository.find({
      where: { isTemplate: true },
      relations: [
        'performance',
        'rehearsalLead',
        'shiftLead',
        'choirMembers',
        'rehearsalSongs',
        'rehearsalSongs.song',
        'rehearsalSongs.leadSinger',
        'rehearsalSongs.chorusMembers',
        'rehearsalSongs.musicians',
        'rehearsalSongs.musicians.user',
        'rehearsalSongs.voiceParts',
        'rehearsalSongs.voiceParts.members',
        'created_by',
      ],
      order: { title: 'ASC' },
    });
  }

  async copyFromTemplate(templateId: number, newDate: string, title: string, userId: number): Promise<Rehearsal> {
    const template = await this.findOne(templateId);
    
    if (!template.isTemplate) {
      throw new BadRequestException('The specified rehearsal is not a template');
    }

    // Create new rehearsal from template
    const newRehearsal = this.rehearsalRepository.create({
      title,
      date: new Date(newDate),
      type: template.type,
      location: template.location,
      duration: template.duration,
      performanceId: template.performanceId,
      rehearsalLeadId: template.rehearsalLeadId,
      notes: template.notes,
      objectives: template.objectives,
      shiftLeadId: template.shiftLeadId,
      createdById: userId,
      isTemplate: false, // New rehearsal is not a template
    });

    const savedRehearsal = await this.rehearsalRepository.save(newRehearsal);

    // Copy choir members
    if (template.choirMembers && template.choirMembers.length > 0) {
      savedRehearsal.choirMembers = template.choirMembers;
      await this.rehearsalRepository.save(savedRehearsal);
    }

    // Copy rehearsal songs
    if (template.rehearsalSongs && template.rehearsalSongs.length > 0) {
      for (const templateSong of template.rehearsalSongs) {
             const rehearsalSong = this.rehearsalSongRepository.create({
         rehearsal: { id: savedRehearsal.id } as Rehearsal,
         song: { id: templateSong.song.id } as Song,
        difficulty: templateSong.difficulty,
        needsWork: false, // Reset for new rehearsal
        order: templateSong.order,
        timeAllocated: templateSong.timeAllocated,
        focusPoints: templateSong.focusPoints,
        notes: templateSong.notes,
        musicalKey: templateSong.musicalKey,
      });

      const savedRehearsalSong = await this.rehearsalSongRepository.save(rehearsalSong);

      // Copy lead singers
      if (templateSong.leadSinger && templateSong.leadSinger.length > 0) {
        const leadSingers = await this.userRepository.findBy({ id: In(templateSong.leadSinger.map((singer: any) => singer.id)) });
        savedRehearsalSong.leadSinger = leadSingers;
        await this.rehearsalSongRepository.save(savedRehearsalSong);
      }

      // Copy chorus members
      if (templateSong.chorusMembers && templateSong.chorusMembers.length > 0) {
        const chorusMembers = await this.userRepository.findBy({ id: In(templateSong.chorusMembers.map((cm: any) => cm.id)) });
        savedRehearsalSong.chorusMembers = chorusMembers;
        await this.rehearsalSongRepository.save(savedRehearsalSong);
      }

      // Copy musicians
      if (templateSong.musicians && templateSong.musicians.length > 0) {
        // ... existing code ...
        const musicians = templateSong.musicians.map((musician: any) => 
          this.rehearsalSongMusicianRepository.create({
            rehearsalSong: { id: savedRehearsalSong.id } as RehearsalSong,
            user: { id: musician.user.id } as User,
            instrument: musician.instrument,
            notes: musician.notes,
            practiceNotes: musician.practiceNotes,
            needsPractice: false, // Reset for new rehearsal
            isSoloist: musician.isSoloist,
            isAccompanist: musician.isAccompanist,
            soloStartTime: musician.soloStartTime,
            soloEndTime: musician.soloEndTime,
            soloNotes: musician.soloNotes,
            accompanimentNotes: musician.accompanimentNotes,
            order: musician.order,
            timeAllocated: musician.timeAllocated,
          })
        );
// ... existing code ...
        
        // Ensure we have a flat array and save each musician individually
        for (const musician of musicians) {
          await this.rehearsalSongMusicianRepository.save(musician);
        }
      }

      // Copy voice parts
      if (templateSong.voiceParts && templateSong.voiceParts.length > 0) {
        for (const templateVoicePart of templateSong.voiceParts) {
          const voicePart = this.rehearsalVoicePartRepository.create({
            rehearsalSong: { id: savedRehearsalSong.id } as RehearsalSong,
            voicePartType: templateVoicePart.voicePartType,
            needsWork: false, // Reset for new rehearsal
            focusPoints: templateVoicePart.focusPoints,
            notes: templateVoicePart.notes,
            order: templateVoicePart.order,
            timeAllocated: templateVoicePart.timeAllocated,
          });

          const savedVoicePart = await this.rehearsalVoicePartRepository.save(voicePart);

          // Copy voice part members
          if (templateVoicePart.members && templateVoicePart.members.length > 0) {
            const members = await this.userRepository.findBy({ id: In(templateVoicePart.members.map((m: any) => m.id)) });
            savedVoicePart.members = members;
            await this.rehearsalVoicePartRepository.save(savedVoicePart);
          }
        }
      }
    }
    }

    return this.findOne(savedRehearsal.id);
  }

  async updateRehearsalSong(
    rehearsalId: number,
    songId: number,
    updateData: UpdateRehearsalSongDto,
    userId: number,
    userType: string,
    userRole?: string
  ): Promise<Rehearsal> {
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
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can update rehearsal songs');
      }
    }

    // Find the rehearsal
    const rehearsal = await this.rehearsalRepository.findOne({
      where: { id: rehearsalId },
      relations: ['rehearsalSongs', 'rehearsalSongs.song']
    });

    if (!rehearsal) {
      throw new NotFoundException(`Rehearsal with ID ${rehearsalId} not found`);
    }

    // Find the specific rehearsal song
    const rehearsalSong = rehearsal.rehearsalSongs.find(rs => rs.id === songId);
    if (!rehearsalSong) {
      throw new NotFoundException(`Song with ID ${songId} not found in rehearsal ${rehearsalId}`);
    }

    // Update the rehearsal song properties (songId cannot be changed)
    // Only update rehearsal-specific properties: difficulty, needsWork, order, 
    // timeAllocated, focusPoints, notes, musicalKey, musicians, voice parts
    await this.rehearsalSongRepository.update(songId, {
      difficulty: updateData.difficulty,
      needsWork: updateData.needsWork,
      order: updateData.order,
      timeAllocated: updateData.timeAllocated,
      focusPoints: updateData.focusPoints,
      notes: updateData.notes,
      musicalKey: updateData.musicalKey,
    });

    // Update musicians if provided
    if (updateData.musicians && updateData.musicians.length > 0) {
      // Remove existing musicians
      await this.rehearsalSongMusicianRepository.delete({ rehearsalSong: { id: songId } });

      // Add new musicians
      for (const musicianData of updateData.musicians) {
        const musician = this.rehearsalSongMusicianRepository.create({
          rehearsalSong: { id: songId },
          user: musicianData.userId ? { id: musicianData.userId } : undefined,
          instrument: musicianData.instrument,
          notes: musicianData.notes,
          practiceNotes: musicianData.practiceNotes,
          needsPractice: musicianData.needsPractice,
          isSoloist: musicianData.isSoloist,
          isAccompanist: musicianData.isAccompanist,
          soloStartTime: musicianData.soloStartTime,
          soloEndTime: musicianData.soloEndTime,
          soloNotes: musicianData.soloNotes,
          accompanimentNotes: musicianData.accompanimentNotes,
          order: musicianData.order,
          timeAllocated: musicianData.timeAllocated,
        });
        await this.rehearsalSongMusicianRepository.save(musician);
      }
    }

    // Update voice parts if provided
    if (updateData.voiceParts && updateData.voiceParts.length > 0) {
      // Remove existing voice parts
      await this.rehearsalVoicePartRepository.delete({ rehearsalSong: { id: songId } });

      // Add new voice parts
      for (const voicePartData of updateData.voiceParts) {
        const voicePart = this.rehearsalVoicePartRepository.create({
          rehearsalSong: { id: songId },
          voicePartType: voicePartData.voicePartType,
          needsWork: voicePartData.needsWork,
          focusPoints: voicePartData.focusPoints,
          notes: voicePartData.notes,
          order: voicePartData.order,
          timeAllocated: voicePartData.timeAllocated,
        });
        await this.rehearsalVoicePartRepository.save(voicePart);
      }
    }

    return this.findOne(rehearsalId);
  }

  async removeRehearsalSong(
    rehearsalId: number,
    songId: number,
    userId: number,
    userType: string,
    userRole?: string
  ): Promise<Rehearsal> {
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
        throw new ForbiddenException('Only SUPER_ADMIN users or LEAD users on active shift can remove rehearsal songs');
      }
    }

    // Find the rehearsal
    const rehearsal = await this.rehearsalRepository.findOne({
      where: { id: rehearsalId },
      relations: ['rehearsalSongs']
    });

    if (!rehearsal) {
      throw new NotFoundException(`Rehearsal with ID ${rehearsalId} not found`);
    }

    // Check if the song exists in the rehearsal
    const rehearsalSong = rehearsal.rehearsalSongs.find(rs => rs.id === songId);
    if (!rehearsalSong) {
      throw new NotFoundException(`Song with ID ${songId} not found in rehearsal ${rehearsalId}`);
    }

    // Remove the rehearsal song (cascade will handle related musicians and voice parts)
    await this.rehearsalSongRepository.delete(songId);

    return this.findOne(rehearsalId);
  }
}
