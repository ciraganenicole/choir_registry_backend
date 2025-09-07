import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, ManyToOne, JoinColumn, AfterInsert, ManyToMany, JoinTable, EntityManager } from 'typeorm';
import { Gender } from './enums/gender.enum';
import { MaritalStatus } from './enums/marital-status.enum';
import { EducationLevel } from './enums/education-level.enum';
import { Profession } from './enums/profession.enum';
import { Commune } from './enums/commune.enum';
import { Commission } from './enums/commission.enum';
import { UserCategory } from './enums/user-category.enum';
import { Attendance } from '../attendance/attendance.entity';
import { Transaction } from '../transactions/transaction.entity';

//Nullable values except firstname & lastname

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
        enum: Gender,
        nullable: true
    })
    gender: Gender; // SEXE

    @Column({
        type: 'varchar',
        enum: MaritalStatus,
        nullable: true
    })
    maritalStatus: MaritalStatus; // ETAT CIVIL

    @Column({
        type: 'varchar',
        enum: EducationLevel,
        nullable: true
    })
    educationLevel: EducationLevel;

    @Column({
        type: 'varchar',
        enum: Profession,
        nullable: true
    })
    profession: Profession;

    @Column({ nullable: true })
    competenceDomain: string; // DOMAINE DE COMPETENCE

    @Column({ nullable: true })
    churchOfOrigin: string; // EGLISE DE PROVENANCE

    @Column({
        type: 'varchar',
        enum: Commune,
        nullable: true
    })
    commune: Commune;

    @Column({ nullable: true })
    quarter: string; // QUARTIER

    @Column({ nullable: true })
    reference: string; // REFERENCE

    @Column({ nullable: true })
    address: string; // AVENUE/N°

    @Column({ unique: true, nullable: true })
    phoneNumber: string; // TELEPHONE MOBILE

    @Column({ nullable: true })
    whatsappNumber: string; // NUMERO WHATSAPP

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({
        type: 'varchar',
        array: true,
        default: '{}',
        nullable: true,
        transformer: {
            to: (value: Commission[]): string[] => {
                if (!value) return [];
                if (Array.isArray(value)) {
                    return value.map(v => v.toString());
                }
                return [];
            },
            from: (value: string[]): Commission[] => {
                if (!value) return [];
                if (Array.isArray(value)) {
                    return value.map(v => v as Commission);
                }
                return [];
            }
        }
    })
    commissions: Commission[];

    @Column({ unique: true, nullable: true })
    matricule: string;

    @Column({
        type: 'varchar',
        array: true,
        default: '{NORMAL}',
        nullable: true,
        transformer: {
            to: (value: UserCategory[]): string[] => {
                if (!value) return [UserCategory.NORMAL];
                if (Array.isArray(value)) {
                    return value.map(v => v.toString());
                }
                return [UserCategory.NORMAL];
            },
            from: (value: string[]): UserCategory[] => {
                if (!value) return [UserCategory.NORMAL];
                if (Array.isArray(value)) {
                    return value.map(v => v as UserCategory);
                }
                return [UserCategory.NORMAL];
            }
        }
    })
    categories: UserCategory[];

    @Column({ nullable: true })
    fingerprintData: string;

    @Column({ nullable: true })
    voiceCategory: string;

    @Column({ type: 'date', nullable: true })
    joinDate: Date;

    @Column({ default: true, nullable: true })
    isActive: boolean;

    @Column({ nullable: true })
    profileImageUrl: string; // Cloudinary public ID

    @Column({ nullable: true })
    password: string; // For regular user authentication

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Transaction, transaction => transaction.contributor)
    transactions: Transaction[];

    @OneToMany(() => Attendance, attendance => attendance.user)
    attendances: Attendance[];

    @AfterInsert()
    async generateMatricule(manager?: EntityManager) {
        if (this.id && !this.matricule) {
            const year = this.joinDate ? this.joinDate.getFullYear() : new Date().getFullYear();
            this.matricule = `NJC-${this.id}-${year}`;
            
            if (manager) {
                await manager
                    .createQueryBuilder()
                    .update(User)
                    .set({ matricule: this.matricule })
                    .where("id = :id", { id: this.id })
                    .execute();
            }
        }
    }
}