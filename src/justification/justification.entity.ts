import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Attendance } from '../attendance/attendance.entity';

@Entity('justification')
export class Justification {
  @PrimaryGeneratedColumn()
  id: number;

//   @ManyToOne(() => Attendance, (attendance) => attendance.justifications, { eager: true })
//   attendance: Attendance;

  @Column({ type: 'text' })
  reason: string;  // Justification reason

  @Column({ type: 'enum', enum: ['late', 'absent'], default: 'late' })
  type: 'late' | 'absent';  // Type of justification (Late or Absent)

  @Column({ type: 'date' })
  date: string;  // Date when justification was provided
}
