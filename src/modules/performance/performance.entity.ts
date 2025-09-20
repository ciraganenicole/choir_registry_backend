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
import { User } from '../users/user.entity';
import { PerformanceSong } from './performance-song.entity';

export enum PerformanceType {
  CONCERT = 'Concert',
  WORSHIP_SERVICE = 'Worship Service',
  SUNDAY_SERVICE = 'Sunday Service',
  SPECIAL_EVENT = 'Special Event',
  REHEARSAL = 'Rehearsal',
  WEDDING = 'Wedding',
  FUNERAL = 'Funeral',
  OTHER = 'Other',
}

export enum PerformanceStatus {
  UPCOMING = 'upcoming',
  IN_PREPARATION = 'in_preparation',
  READY = 'ready',
  COMPLETED = 'completed',
}

@Entity('performances')
export class Performance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp with time zone' })
  date: Date;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  expectedAudience: number;

  @Column({
    type: 'enum',
    enum: PerformanceType,
    enumName: 'performance_type_enum',
    default: PerformanceType.CONCERT,
  })
  type: PerformanceType;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'shiftLeadId' })
  shiftLead: User;

  @Column({ nullable: true })
  shiftLeadId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'enum',
    enum: PerformanceStatus,
    enumName: 'performance_status_enum',
    default: PerformanceStatus.UPCOMING,
  })
  status: PerformanceStatus;

  @OneToMany(() => PerformanceSong, (ps) => ps.performance, {
    cascade: true,
  })
  performanceSongs: PerformanceSong[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
} 