import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Attendance } from '../attendance/attendance.entity';
import { UserCategory } from '../users/user-category.enum';
import { EventType } from './event-type.enum';

@Entity()
export class Event {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string; // e.g., "Rehearsal", "Sunday Service"

    @Column({ type: 'enum', enum: EventType })
    type: EventType; // e.g., REGULAR, RANDOM, SPECIAL

    @Column({ nullable: true })
    category: UserCategory; // e.g., Worshippers, Musicians

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'time' })
    startTime: string;

    @Column({ type: 'time' })
    endTime: string;

    @OneToMany(() => Attendance, attendance => attendance.event)
    attendance: Attendance[];
}