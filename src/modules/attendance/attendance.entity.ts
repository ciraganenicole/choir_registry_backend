import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';

export enum AttendanceStatus {
    PRESENT = 'present',
    ABSENT = 'absent',
    LATE = 'late'
}

@Entity('attendance')
export class Attendance {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.attendance)
    user: User;

    @ManyToOne(() => Event, event => event.attendance)
    event: Event;

    @Column({
        type: 'enum',
        enum: AttendanceStatus,
        default: AttendanceStatus.ABSENT
    })
    status: AttendanceStatus;

    @Column({ default: false })
    justified: boolean;
}
