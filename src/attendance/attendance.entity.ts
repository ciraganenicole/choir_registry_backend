import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

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

  @Column({ default: false })
  attended: boolean;
}
