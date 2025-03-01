import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { LeaveType } from '../../common/dtos/leave.dto';

@Entity('leave')
export class Leave {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.leaves)
    user: User;

    @Column({ type: 'date' })
    startDate: string;

    @Column({ type: 'date', nullable: true })
    endDate: string;

    @Column({
        type: 'enum',
        enum: LeaveType,
        default: LeaveType.OTHER
    })
    leaveType: LeaveType;

    @Column({ default: false })
    approved: boolean;

    @Column({ default: false })
    rejected: boolean;
} 