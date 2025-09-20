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
import { User } from '../users/user.entity';
import { RehearsalSong } from './rehearsal-song.entity';
import { Performance } from '../performance/performance.entity';

export enum RehearsalType {
  GENERAL_PRACTICE = 'General Practice',
  PERFORMANCE_PREP = 'Performance Preparation',
  SONG_LEARNING = 'Song Learning',
  SECTIONAL = 'Sectional Practice',
  FULL_ENSEMBLE = 'Full Ensemble',
  DRESS_REHEARSAL = 'Dress Rehearsal',
  OTHER = 'Other',
}

export enum RehearsalStatus {
  PLANNING = 'Planning',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Entity('rehearsals')
export class Rehearsal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'timestamp with time zone' })
  date: Date;

  @Column({
    type: 'enum',
    enum: RehearsalType,
    enumName: 'rehearsal_type_enum',
    default: RehearsalType.GENERAL_PRACTICE,
  })
  type: RehearsalType;

  @Column({
    type: 'enum',
    enum: RehearsalStatus,
    enumName: 'rehearsal_status_enum',
    default: RehearsalStatus.PLANNING,
  })
  status: RehearsalStatus;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  duration: number; // Duration in minutes

  @Column()
  performanceId: number; // Link to performance (this rehearsal prepares for this performance)

  @ManyToOne(() => Performance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'performanceId' })
  performance: Performance;

  @Column({ nullable: true })
  rehearsalLeadId: number | null; // Who is leading this specific rehearsal (can be different from shift lead)

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'rehearsalLeadId' })
  rehearsalLead: User;

  @Column({ default: false })
  isTemplate: boolean; // Can be reused for future rehearsals

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  objectives: string; // What to achieve in this rehearsal

  @Column({ type: 'text', nullable: true })
  feedback: string; // Post-rehearsal feedback

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'shiftLeadId' })
  shiftLead: User;

  @Column({ nullable: true })
  shiftLeadId: number;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'rehearsal_choir_members',
    joinColumn: {
      name: 'rehearsalId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  choirMembers: User[];

  @OneToMany(() => RehearsalSong, (rs) => rs.rehearsal, {
    cascade: true,
  })
  rehearsalSongs: RehearsalSong[];

  @Column()
  createdById: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  created_by: User;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
