import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Gender } from './enums/gender.enum';
import { MaritalStatus } from './enums/marital-status.enum';
import { EducationLevel } from './enums/education-level.enum';
import { Profession } from './enums/profession.enum';
import { Commune } from './enums/commune.enum';
import { Commission } from './enums/commission.enum';
import { Attendance } from '../attendance/attendance.entity';
import { Leave } from '../leave/leave.entity';
import { UserCategory } from './enums/user-category.enum';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string; // PRENOM

    @Column()
    lastName: string; // NOMS

    @Column({
        type: 'enum',
        enum: Gender
    })
    gender: Gender; // SEXE

    @Column({
        type: 'enum',
        enum: MaritalStatus
    })
    maritalStatus: MaritalStatus; // ETAT CIVIL

    @Column({
        type: 'enum',
        enum: EducationLevel
    })
    educationLevel: EducationLevel;

    @Column({
        type: 'enum',
        enum: Profession
    })
    profession: Profession;

    @Column({ nullable: true })
    competenceDomain: string; // DOMAINE DE COMPETENCE

    @Column()
    churchOfOrigin: string; // EGLISE DE PROVENANCE

    @Column({
        type: 'enum',
        enum: Commune
    })
    commune: Commune;

    @Column()
    quarter: string; // QUARTIER

    @Column()
    reference: string; // REFERENCE

    @Column()
    address: string; // AVENUE/N°

    @Column({ unique: true })
    phoneNumber: string; // TELEPHONE MOBILE

    @Column({ nullable: true })
    whatsappNumber: string; // NUMERO WHATSAPP

    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column('text', { array: true, default: [] })
    commissions: Commission[];

    @Column({ nullable: true })
    matricule: string;

    @Column('text', { array: true, default: [] })
    categories: UserCategory[];

    @Column({ nullable: true })
    fingerprintData: string;

    @Column({ nullable: true })
    voiceCategory: string;

    @Column({ nullable: true })
    joinDate: Date;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Attendance, attendance => attendance.user)
    attendance: Attendance[];

    @OneToMany(() => Leave, leave => leave.user)
    leaves: Leave[];
} 