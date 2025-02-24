import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, OneToMany } from 'typeorm';
import { Attendance } from '../attendance/attendance.entity';
import { Leave } from '../leave/leave.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()

  id: number;

  @Column()
  name: string;

  @Column()
  surname: string;

  @Column()
  phoneNumber: string;

  @Column({ unique: true, nullable: true })
matricule: string;

  @Column({ type: 'text', nullable: true })
publicKey?: string | null;

@Column({ nullable: true })
  challenge: string;

  @Column({ type: 'bigint', default: 0 })  // Add this column
  counter: number;

  @Column({ type: 'text', nullable: true }) // Add this column
  credentialID: string;

  @OneToMany(() => Leave, (leave) => leave.user, { cascade: true })
  leaves: Leave[];

  @OneToMany(() => Attendance, (attendance) => attendance.user, { cascade: true })
  attendance: Attendance[];

@Column({ default: () => 'CURRENT_TIMESTAMP' })
created_at: string;

}
