import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Department } from '../users/department.entity';

export enum SongDifficulty {
  EASY = 'Easy',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export enum SongStatus {
  IN_REHEARSAL = 'In Rehearsal',
  ACTIVE = 'Active',
  ARCHIVED = 'Archived',
}

@Entity('songs')
export class Song {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  composer: string;

  @Column()
  genre: string;

  @Column({
    type: 'enum',
    enum: SongDifficulty,
    enumName: 'song_difficulty_enum',
  })
  difficulty: SongDifficulty;

  @Column({
    type: 'enum',
    enum: SongStatus,
    enumName: 'song_status_enum',
  })
  status: SongStatus;

  @Column('text')
  lyrics: string;

  @Column({ type: 'text', nullable: true })
  audioUrl: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  duration: string | null;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'departmentId' })
  department?: Department | null;

  @Column({ type: 'int', nullable: true })
  departmentId: number | null;

  @Column({ type: 'int', nullable: true })
  albumId: number | null;

  @Column({ default: 0 })
  times_performed: number;

  @Column({ type: 'date', nullable: true })
  last_performed: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'addedById' })
  added_by?: User;

  @Column({ nullable: true })
  addedById?: number | null;
} 