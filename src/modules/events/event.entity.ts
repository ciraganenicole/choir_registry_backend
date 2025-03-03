import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { EventType } from './event-type.enum';
import { Attendance } from '../attendance/attendance.entity';
import { UserCategory } from '../users/enums/user-category.enum';

@Entity('events')
export class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: EventType
    })
    type: EventType;

    @Column({
        type: 'enum',
        enum: UserCategory,
        nullable: true
    })
    category: UserCategory;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'time' })
    startTime: string;

    @Column({ type: 'time' })
    endTime: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Attendance, attendance => attendance.event)
    attendance: Attendance[];
}