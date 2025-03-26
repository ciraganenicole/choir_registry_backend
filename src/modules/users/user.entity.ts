import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, ManyToOne, JoinColumn, AfterInsert, ManyToMany, JoinTable } from 'typeorm';
import { Gender } from './enums/gender.enum';
import { MaritalStatus } from './enums/marital-status.enum';
import { EducationLevel } from './enums/education-level.enum';
import { Profession } from './enums/profession.enum';
import { Commune } from './enums/commune.enum';
import { Commission } from './enums/commission.enum';
import { UserCategory } from './enums/user-category.enum';
import { Attendance } from '../attendance/attendance.entity';
import { Leave } from '../leave/leave.entity';
import { Transaction } from '../transactions/transaction.entity';
import { AppDataSource } from '../../data-source';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string; // PRENOM

    @Column()
    lastName: string; // NOMS

    @Column({
        type: 'varchar',
        enum: Gender
    })
    gender: Gender; // SEXE

    @Column({
        type: 'varchar',
        enum: MaritalStatus
    })
    maritalStatus: MaritalStatus; // ETAT CIVIL

    @Column({
        type: 'varchar',
        enum: EducationLevel
    })
    educationLevel: EducationLevel;

    @Column({
        type: 'varchar',
        enum: Profession
    })
    profession: Profession;

    @Column({ nullable: true })
    competenceDomain: string; // DOMAINE DE COMPETENCE

    @Column()
    churchOfOrigin: string; // EGLISE DE PROVENANCE

    @Column({
        type: 'varchar',
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

    @Column({
        type: 'varchar',
        array: true,
        default: '{}',
        transformer: {
            to: (value: Commission[]): string[] => value ? value.map(v => v.toString()) : [],
            from: (value: string[]): Commission[] => value ? value.map(v => v as Commission) : []
        }
    })
    commissions: Commission[];

    @Column({ unique: true, nullable: true })
    matricule: string;

    @Column({
        type: 'varchar',
        array: true,
        default: '{NORMAL}',
        transformer: {
            to: (value: UserCategory[]): string[] => value ? value.map(v => v.toString()) : [UserCategory.NORMAL],
            from: (value: string[]): UserCategory[] => value ? value.map(v => v as UserCategory) : [UserCategory.NORMAL]
        }
    })
    categories: UserCategory[];

    @Column({ nullable: true })
    fingerprintData: string;

    @Column({ nullable: true })
    voiceCategory: string;

    @Column({ type: 'date', nullable: true })
    joinDate: Date;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    profileImageUrl: string; // Cloudinary public ID

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Attendance, attendance => attendance.user)
    attendances: Attendance[];

    @OneToMany(() => Leave, leave => leave.user)
    leaves: Leave[];

    @OneToMany(() => Transaction, transaction => transaction.contributor)
    transactions: Transaction[];

    @AfterInsert()
    async generateMatricule() {
        if (this.id && !this.matricule) {
            this.matricule = `NJC-${this.id}`;
            await AppDataSource.getRepository(User).update(this.id, { matricule: this.matricule });
        }
    }
}