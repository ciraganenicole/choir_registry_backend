import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

export enum AttendanceStatus {
  PRESENT = "present",
  ABSENT = "absent",
  LATE = "late",
}

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.attendance, { eager: true })
  user: User;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'time' })
  dateTime: string;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;  // Tracks if the user was present, absent, or late

  @Column({ type: 'boolean', default: false })
  justified: boolean;  // Tracks if the late user has been justified by the admin
}
