import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdminUser } from '../admin/admin_users.entity';

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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  composer: string;

  @Column()
  genre: string;

  @Column()
  duration: string;

  @Column({
    type: 'enum',
    enum: SongDifficulty,
  })
  difficulty: SongDifficulty;

  @Column({
    type: 'enum',
    enum: SongStatus,
  })
  status: SongStatus;

  @Column('text', { array: true })
  voice_parts: string[];

  @Column('text')
  lyrics: string;

  @Column({ default: 0 })
  times_performed: number;

  @Column({ type: 'date', nullable: true })
  last_performed: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => AdminUser, { nullable: false })
  @JoinColumn({ name: 'addedById' })
  added_by: AdminUser;

  @Column()
  addedById: string;
} 