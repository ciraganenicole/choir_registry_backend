import { Song } from '../song.entity';
import { User } from '../../users/user.entity';
import { UserCategory } from '../../users/enums/user-category.enum';

export class UserResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  categories?: UserCategory[];
  matricule?: string;
}

export class SongResponseDto {
  id: number;
  title: string;
  composer: string;
  genre: string;
  difficulty: string;
  status: string;
  lyrics?: string;
  performed: number;
  lastPerformance?: string;
  added_by?: UserResponseDto;
  addedById?: number;
  createdAt?: string;
  updatedAt?: string;

  static fromEntity(song: Song): SongResponseDto {
    return {
      id: song.id,
      title: song.title,
      composer: song.composer,
      genre: song.genre,
      difficulty: song.difficulty,
      status: song.status,
      lyrics: song.lyrics,
      performed: song.times_performed,
      lastPerformance: song.last_performed ? (song.last_performed instanceof Date ? song.last_performed.toISOString() : new Date(song.last_performed).toISOString()) : undefined,
      added_by: song.added_by ? {
        id: song.added_by.id,
        firstName: song.added_by.firstName,
        lastName: song.added_by.lastName,
        email: song.added_by.email,
        categories: song.added_by.categories,
        matricule: song.added_by.matricule,
      } : undefined,
      addedById: song.addedById,
      createdAt: song.created_at?.toISOString(),
      updatedAt: song.updated_at?.toISOString(),
    };
  }

  static fromEntities(songs: Song[]): SongResponseDto[] {
    return songs.map(song => SongResponseDto.fromEntity(song));
  }
} 