import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    CreateDateColumn, 
    UpdateDateColumn, 
    JoinColumn 
} from 'typeorm';
import { User } from '../users/user.entity';

export enum AttendanceStatus {
    PRESENT = 'PRESENT',
    LATE = 'LATE',
    ABSENT = 'ABSENT'
}

export enum AttendanceType {
    MANUAL = 'MANUAL',
    BIOMETRIC = 'BIOMETRIC'
}

export enum AttendanceEventType {
    REHEARSAL = 'REHEARSAL',  
    SUNDAY_SERVICE = 'SUNDAY_SERVICE', 
    LOUADO = 'LOUADO',  
    MUSIC = 'MUSIC', 
    COMMITTEE = 'COMMITTEE', 
    OTHER = 'OTHER'  
}

export enum JustificationReason {
    ILLNESS = 'ILLNESS',
    WORK = 'WORK',
    TRAVEL = 'TRAVEL',
    FAMILY_EMERGENCY = 'FAMILY_EMERGENCY',
    SCHOOL = 'SCHOOL',
    OTHER = 'OTHER'
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

    @Column({
        type: 'varchar',
        enum: AttendanceEventType,
        default: AttendanceEventType.OTHER
    })
    eventType: AttendanceEventType;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'time', nullable: true }) // Nullable for absentees
    timeIn?: string;

    @Column({
        type: 'varchar',
        enum: AttendanceStatus
    })
    status: AttendanceStatus;

    @Column({
        type: 'varchar',
        enum: AttendanceType,
        default: AttendanceType.MANUAL
    })
    type: AttendanceType;

    @Column({
        type: 'varchar',
        enum: JustificationReason,
        nullable: true  // Nullable if no justification provided
    })
    justification?: JustificationReason;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
