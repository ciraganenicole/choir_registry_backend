import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ShiftStatus {
  ACTIVE = 'Active',
  UPCOMING = 'Upcoming',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Entity('leadership_shifts')
export class LeadershipShift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'timestamp with time zone' })
  startDate: Date;

  @Column({ type: 'timestamp with time zone' })
  endDate: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'leaderId' })
  leader: User;

  @Column({ nullable: true })
  leaderId: number;

  @Column({
    type: 'enum',
    enum: ShiftStatus,
    enumName: 'shift_status_enum',
    default: ShiftStatus.UPCOMING,
  })
  status: ShiftStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 0 })
  eventsScheduled: number;

  @Column({ default: 0 })
  eventsCompleted: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  created_by: User;

  @Column({ nullable: true })
  createdById: number;
} 