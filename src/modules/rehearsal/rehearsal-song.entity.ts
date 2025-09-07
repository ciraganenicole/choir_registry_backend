import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Rehearsal } from './rehearsal.entity';
import { Song, SongDifficulty } from '../song/song.entity';
import { User } from '../users/user.entity';
import { RehearsalSongMusician } from './rehearsal-song-musician.entity';
import { RehearsalVoicePart } from './rehearsal-voice-part.entity';

export enum MusicalKey {
  C = 'C',
  C_SHARP = 'C#',
  D = 'D',
  D_SHARP = 'D#',
  E = 'E',
  F = 'F',
  F_SHARP = 'F#',
  G = 'G',
  G_SHARP = 'G#',
  A = 'A',
  A_SHARP = 'A#',
  B = 'B',
}

@Entity('rehearsal_songs')
export class RehearsalSong {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Rehearsal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rehearsalId' })
  rehearsal: Rehearsal;

  @ManyToOne(() => Song, { nullable: false })
  @JoinColumn({ name: 'songId' })
  song: Song;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'rehearsal_song_lead_singers',
    joinColumn: {
      name: 'rehearsalSongId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  leadSinger: User[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'rehearsal_song_chorus_members',
    joinColumn: {
      name: 'rehearsalSongId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  chorusMembers: User[];

  @OneToMany(() => RehearsalSongMusician, (rsm) => rsm.rehearsalSong, {
    cascade: true,
  })
  musicians: RehearsalSongMusician[];

  @OneToMany(() => RehearsalVoicePart, (rvp) => rvp.rehearsalSong, {
    cascade: true,
  })
  voiceParts: RehearsalVoicePart[];

  @Column({
    type: 'enum',
    enum: SongDifficulty,
    enumName: 'song_difficulty_enum',
    default: SongDifficulty.INTERMEDIATE,
  })
  difficulty: SongDifficulty;

  @Column({ default: false })
  needsWork: boolean;

  @Column({ default: 1 })
  order: number; // Order of songs in the rehearsal

  @Column({ nullable: true })
  timeAllocated: number; // Time allocated in minutes

  @Column({ type: 'text', nullable: true })
  focusPoints: string; // What to focus on during rehearsal

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: MusicalKey,
    enumName: 'musical_key_enum',
    nullable: true,
  })
  musicalKey: MusicalKey; // Musical key (gamme) for the song

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
