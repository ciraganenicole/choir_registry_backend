import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Song, SongDifficulty, SongStatus } from './song.entity';
import { CreateSongDto } from './dto/create-song.dto';
import { UpdateSongDto } from './dto/update-song.dto';
import { AdminUser } from '../admin/admin_users.entity';

export interface SongFilter {
  genre?: string;
  difficulty?: SongDifficulty;
  status?: SongStatus;
}

@Injectable()
export class SongService {
  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}

  async create(createSongDto: CreateSongDto, admin: any): Promise<Song> {
    const dbAdmin = await this.adminUserRepository.findOneBy({ id: admin.id });
    if (!dbAdmin) {
      throw new NotFoundException(`Admin with id ${admin.id} not found`);
    }
    const song = this.songRepository.create({ ...createSongDto, added_by: dbAdmin, addedById: dbAdmin.id });
    return this.songRepository.save(song);
  }

  async findAll(filter: SongFilter = {}): Promise<Song[]> {
    const query = this.songRepository.createQueryBuilder('song');
    if (filter.genre) {
      query.andWhere('song.genre = :genre', { genre: filter.genre });
    }
    if (filter.difficulty) {
      query.andWhere('song.difficulty = :difficulty', { difficulty: filter.difficulty });
    }
    if (filter.status) {
      query.andWhere('song.status = :status', { status: filter.status });
    }
    return query.getMany();
  }

  async findOne(id: string): Promise<Song> {
    const song = await this.songRepository.findOneBy({ id });
    if (!song) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }
    return song;
  }

  async update(id: string, updateSongDto: UpdateSongDto): Promise<Song> {
    await this.songRepository.update(id, updateSongDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.songRepository.delete(id);
  }
} 