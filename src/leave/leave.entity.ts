import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('leave')
export class Leave {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.leaves, { eager: true })
  user: User;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;  // For leave that spans multiple days

  @Column({ type: 'enum', enum: ['sick', 'vacation', 'personal', 'suspension', 'work', 'other'], default: 'other' })
  leaveType: string; // Optional field to provide a reason for the leave
}
