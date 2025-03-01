// import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
// import { Attendance } from '../attendance/attendance.entity';

// @Entity('rehearsals')
// export class Rehearsal {
//     @PrimaryGeneratedColumn()
//     id: number;

//     @Column()
//     title: string;

//     @CreateDateColumn()
//     date: Date;

//     @Column({ nullable: true })
//     notes: string;

//     @Column({ default: 'REHEARSAL' })
//     type: 'REHEARSAL' | 'PERFORMANCE' | 'SPECIAL_EVENT';

//     @OneToMany(() => Attendance, attendance => attendance.rehearsal)
//     attendances: Attendance[];
// } 