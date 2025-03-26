import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    ABSENT = 'ABSENT',
    LATE = 'LATE',
    EXCUSED = 'EXCUSED'
}

export enum AttendanceType {
    MANUAL = 'MANUAL',
    BIOMETRIC = 'BIOMETRIC'
}

export enum AttendanceEventType {
    NORMAL = 'NORMAL',          // Regular daily attendance
    WORSHIPPER = 'WORSHIPPER',  // Worshipper practice/performance
    COMMITTEE = 'COMMITTEE',    // Administrative meetings
    MUSIC = 'MUSIC',           // Music practice/performance
    SUNDAY_SERVICE = 'SUNDAY_SERVICE', // Sunday service
    SPECIAL = 'SPECIAL'        // Special events
}

@Entity('attendance')
export class Attendance {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.attendances)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: number;

    @Column()
    eventName: string;

    @Column({
        type: 'varchar',
        enum: AttendanceEventType,
        default: AttendanceEventType.NORMAL
    })
    eventType: AttendanceEventType;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'text' })
    startTime: string;

    @Column({ type: 'text' })
    endTime: string;

    @Column({
        type: 'varchar',
        enum: AttendanceStatus,
        default: AttendanceStatus.PRESENT
    })
    status: AttendanceStatus;

    @Column({
        type: 'varchar',
        enum: AttendanceType,
        default: AttendanceType.MANUAL
    })
    type: AttendanceType;

    @Column({ default: false })
    justified: boolean;

    @Column({ type: 'text', nullable: true })
    justification?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
