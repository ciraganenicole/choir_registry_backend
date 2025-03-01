import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert } from 'typeorm';
import { UserCategory } from './user-category.enum';
import { Attendance } from '../attendance/attendance.entity';
import { Leave } from '../leave/leave.entity';
import { VoiceCategory } from './voice-category.enum';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    surname: string;

    @Column({ unique: true })
    matricule: string;

    @Column({ unique: true })
    phoneNumber: string;

    @Column('text', { array: true, default: [] })
    categories: UserCategory[];

    @Column({ nullable: true })
    fingerprintData: string;

    @Column()
    voiceCategory: VoiceCategory;

    @Column({ nullable: true })
    joinDate: Date;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Attendance, attendance => attendance.user)
    attendance: Attendance[];

    @OneToMany(() => Leave, leave => leave.user)
    leaves: Leave[];

    // Before inserting a new user, generate matricule
    @BeforeInsert()
    generateMatricule() {
        this.matricule = `NJC-${this.id}`; // Format matricule as 'NJC-userId'
    }
} 