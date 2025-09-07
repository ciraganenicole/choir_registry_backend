import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Song, SongStatus, SongDifficulty } from './song.entity';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { SongFilterDto } from './dto/song-filter.dto';
import { PaginatedResponseDto } from './dto/paginated-response.dto';
import { SongUser, SongPermission } from './dto/song-permissions.dto';
import { User } from '../users/user.entity';
import { AdminUser } from '../admin/admin_users.entity';
import { UserCategory } from '../users/enums/user-category.enum';

export interface SongStats {
  totalSongs: number;
  activeRepertoire: number;
  inRehearsal: number;
  newAdditions: number;
  byDifficulty: Record<SongDifficulty, number>;
  byGenre: Record<string, number>;
}

@Injectable()
export class SongService {
  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  private async getUserInfo(userId: number | string): Promise<SongUser> {
    // First try to find as regular user (integer ID)
    if (typeof userId === 'number') {
      const user = await this.userRepository.findOneBy({ id: userId });
      if (user) {
        return {
          id: user.id,
          type: 'user',
          categories: user.categories,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        };
      }
    }

    // If not found or string ID, try as admin user (convert string to number if needed)
    const adminUserId = typeof userId === 'string' ? parseInt(userId) : userId;
    if (isNaN(adminUserId)) {
      throw new NotFoundException(`Invalid user ID: ${userId}`);
    }
    
    const adminUser = await this.adminUserRepository.findOneBy({ id: adminUserId });
    if (adminUser) {
      return {
        id: adminUser.id,
        type: 'admin',
        username: adminUser.username,
        email: adminUser.email,
      };
    }

    throw new NotFoundException(`User with id ${userId} not found`);
  }

  private getSongPermissions(user: SongUser): SongPermission {
    if (user.type === 'admin') {
      // Admin users have full permissions
      return {
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canViewAll: true,
        canManageOthers: true,
      };
    }

    if (user.type === 'user' && user.categories?.includes(UserCategory.LEAD)) {
      // Users with LEAD category can manage songs but only their own
      return {
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canViewAll: true,
        canManageOthers: false,
      };
    }

    // Regular users have no permissions
    return {
      canCreate: false,
      canUpdate: false,
      canDelete: false,
      canViewAll: true,
      canManageOthers: false,
    };
  }

  private async canManageSong(songId: number, user: SongUser): Promise<boolean> {
    const permissions = this.getSongPermissions(user);
    
    if (permissions.canManageOthers) {
      return true; // Admins can manage all songs
    }

    if (!permissions.canUpdate) {
      return false; // No update permissions
    }

    // Check if user owns the song
    const song = await this.songRepository.findOne({
      where: { id: songId },
      select: ['addedById']
    });

    return song ? song.addedById === user.id : false;
  }

  async create(createSongDto: CreateSongDto, userId: number): Promise<Song> {
    const user = await this.getUserInfo(userId);
    const permissions = this.getSongPermissions(user);

    if (!permissions.canCreate) {
      throw new ForbiddenException('You do not have permission to create songs. Only users with LEAD category or admin privileges can create songs.');
    }

    // Check if song with same title and composer already exists
    const existingSong = await this.songRepository.findOne({
      where: { 
        title: createSongDto.title,
        composer: createSongDto.composer 
      }
    });
    
    if (existingSong) {
      throw new BadRequestException('A song with this title and composer already exists');
    }

    // Get the user entity for the relationship
    let userEntity;
    if (user.type === 'admin') {
      // For admin users, we need to handle this differently since they're not in the users table
      // We'll create the song without the added_by relationship for admin users
      const song = this.songRepository.create({ 
        ...createSongDto, 
        addedById: 0, // Use 0 to indicate admin-created song
        last_performed: createSongDto.last_performed ? new Date(createSongDto.last_performed) : undefined
      });
      return this.songRepository.save(song);
    } else {
      // For regular users (including LEAD users)
      userEntity = await this.userRepository.findOneBy({ id: user.id });
      if (!userEntity) {
        throw new NotFoundException(`User entity not found`);
      }
      
      const song = this.songRepository.create({ 
        ...createSongDto, 
        added_by: userEntity, 
        addedById: user.id,
        last_performed: createSongDto.last_performed ? new Date(createSongDto.last_performed) : undefined
      });
      
      return this.songRepository.save(song);
    }
  }

  async findAll(filter: SongFilterDto): Promise<PaginatedResponseDto<Song>> {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC', ...filters } = filter;
    const skip = (page - 1) * limit;

    const query = this.buildSongQuery(filters);
    
    // Get total count
    const total = await query.getCount();
    
    // Get paginated results
    const songs = await query
      .orderBy(`song.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getMany();

    return new PaginatedResponseDto<Song>(songs, page, limit, total);
  }

  async findAllWithoutPagination(filter: Partial<SongFilterDto>): Promise<Song[]> {
    const query = this.buildSongQuery(filter);
    return query.getMany();
  }

  private buildSongQuery(filters: Partial<SongFilterDto>): SelectQueryBuilder<Song> {
    const query = this.songRepository.createQueryBuilder('song')
      .leftJoinAndSelect('song.added_by', 'added_by');
    
    if (filters.genre) {
      query.andWhere('LOWER(song.genre) = LOWER(:genre)', { genre: filters.genre });
    }
    
    if (filters.difficulty) {
      query.andWhere('song.difficulty = :difficulty', { difficulty: filters.difficulty });
    }
    
    if (filters.status) {
      query.andWhere('song.status = :status', { status: filters.status });
    }
    
    if (filters.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      query.andWhere(
        '(LOWER(song.title) LIKE :search OR LOWER(song.composer) LIKE :search OR LOWER(song.genre) LIKE :search OR LOWER(song.lyrics) LIKE :search)',
        { search: searchTerm }
      );
    }
    
    return query;
  }

  async getStats(): Promise<SongStats> {
    // Use raw SQL for better performance
    const stats = await this.songRepository
      .createQueryBuilder('song')
      .select([
        'COUNT(*) as totalSongs',
        'SUM(CASE WHEN song.status = :activeStatus THEN 1 ELSE 0 END) as activeRepertoire',
        'SUM(CASE WHEN song.status = :rehearsalStatus THEN 1 ELSE 0 END) as inRehearsal',
        'SUM(CASE WHEN song.created_at >= :oneMonthAgo THEN 1 ELSE 0 END) as newAdditions'
      ])
      .setParameters({
        activeStatus: SongStatus.ACTIVE,
        rehearsalStatus: SongStatus.IN_REHEARSAL,
        oneMonthAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      })
      .getRawOne();

    // Get difficulty breakdown
    const difficultyStats = await this.songRepository
      .createQueryBuilder('song')
      .select('song.difficulty', 'difficulty')
      .addSelect('COUNT(*)', 'count')
      .groupBy('song.difficulty')
      .getRawMany();

    // Get genre breakdown
    const genreStats = await this.songRepository
      .createQueryBuilder('song')
      .select('song.genre', 'genre')
      .addSelect('COUNT(*)', 'count')
      .groupBy('song.genre')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalSongs: parseInt(stats.totalSongs) || 0,
      activeRepertoire: parseInt(stats.activeRepertoire) || 0,
      inRehearsal: parseInt(stats.inRehearsal) || 0,
      newAdditions: parseInt(stats.newAdditions) || 0,
      byDifficulty: difficultyStats.reduce((acc, item) => {
        acc[item.difficulty] = parseInt(item.count);
        return acc;
      }, {} as Record<SongDifficulty, number>),
      byGenre: genreStats.reduce((acc, item) => {
        acc[item.genre] = parseInt(item.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async findOne(id: number): Promise<Song> {
    const song = await this.songRepository.findOne({
      where: { id },
      relations: ['added_by'],
    });
    
    if (!song) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }
    
    return song;
  }

  async findByUser(userId: number): Promise<Song[]> {
    const user = await this.getUserInfo(userId);
    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return this.songRepository.find({
      where: { addedById: userId },
      relations: ['added_by'],
      order: { created_at: 'DESC' },
    });
  }

  async update(id: number, updateSongDto: UpdateSongDto, userId: number): Promise<Song> {
    const user = await this.getUserInfo(userId);
    const canManage = await this.canManageSong(id, user);

    if (!canManage) {
      throw new ForbiddenException('You can only update songs you added or have admin permissions');
    }

    // Check for duplicate title/composer if being updated
    if (updateSongDto.title || updateSongDto.composer) {
      const song = await this.findOne(id);
      const existingSong = await this.songRepository.findOne({
        where: { 
          title: updateSongDto.title || song.title,
          composer: updateSongDto.composer || song.composer,
        },
        relations: ['added_by']
      });
      
      // Check if the found song is different from the current one
      if (existingSong && existingSong.id !== id) {
        throw new BadRequestException('A song with this title and composer already exists');
      }
    }

    await this.songRepository.update(id, {
      ...updateSongDto,
      last_performed: updateSongDto.last_performed ? new Date(updateSongDto.last_performed) : undefined
    });
    
    return this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const user = await this.getUserInfo(userId);
    const canManage = await this.canManageSong(id, user);

    if (!canManage) {
      throw new ForbiddenException('You can only delete songs you added or have admin permissions');
    }
    
    await this.songRepository.delete(id);
  }

  async incrementPerformanceCount(id: number): Promise<Song> {
    const song = await this.findOne(id);
    
    await this.songRepository.update(id, {
      times_performed: song.times_performed + 1,
      last_performed: new Date()
    });
    
    return this.findOne(id);
  }

  async bulkUpdateStatus(songIds: number[], status: SongStatus, userId: number): Promise<void> {
    const user = await this.getUserInfo(userId);
    const permissions = this.getSongPermissions(user);

    if (!permissions.canManageOthers) {
      // Check if user owns all songs
      const songs = await this.songRepository.find({
        where: { id: In(songIds) },
        select: ['id', 'addedById']
      });

      const unauthorizedSongs = songs.filter(song => song.addedById !== user.id);
      if (unauthorizedSongs.length > 0) {
        throw new ForbiddenException('You can only update songs you added');
      }
    }

    await this.songRepository.update(songIds, { status });
  }

  async getUserPermissions(userId: number): Promise<SongPermission> {
    const user = await this.getUserInfo(userId);
    return this.getSongPermissions(user);
  }
} 