import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Performance } from './performance.entity';
import { Song } from '../song/song.entity';
import { User } from '../users/user.entity';
import { PerformanceSongMusician } from './performance-song-musician.entity';
import { PerformanceVoicePart } from './performance-voice-part.entity';

@Entity('performance_songs')
export class PerformanceSong {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Performance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'performanceId' })
  performance: Performance;

  @Column()
  performanceId: number;

  @ManyToOne(() => Song, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'songId' })
  song: Song;

  @Column()
  songId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'leadSingerId' })
  leadSinger: User;

  @Column({ nullable: true })
  leadSingerId: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 1 })
  order: number;

  @Column({ nullable: true })
  timeAllocated: number; // Time allocated in minutes

  @Column({ type: 'text', nullable: true })
  focusPoints: string;

  @Column({ type: 'text', nullable: true })
  musicalKey: string; // Musical key from rehearsal

  @OneToMany(() => PerformanceSongMusician, (psm) => psm.performanceSong, {
    cascade: true,
  })
  musicians: PerformanceSongMusician[];

  @OneToMany(() => PerformanceVoicePart, (pvp) => pvp.performanceSong, {
    cascade: true,
  })
  voiceParts: PerformanceVoicePart[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
