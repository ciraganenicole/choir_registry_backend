import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { PerformanceSong } from './performance-song.entity';
import { User } from '../users/user.entity';
import { VoicePartType } from '../rehearsal/rehearsal-voice-part.entity';

@Entity('performance_voice_parts')
export class PerformanceVoicePart {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PerformanceSong, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'performanceSongId' })
  performanceSong: PerformanceSong;

  @Column()
  performanceSongId: number;

  @Column({
    type: 'enum',
    enum: VoicePartType,
    enumName: 'voice_part_type_enum',
  })
  type: VoicePartType;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'performance_voice_part_members',
    joinColumn: {
      name: 'performanceVoicePartId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  members: User[];

  @Column({ default: false })
  needsWork: boolean;

  @Column({ type: 'text', nullable: true })
  focusPoints: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 1 })
  order: number;

  @Column({ nullable: true })
  timeAllocated: number; // Time allocated in minutes

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
