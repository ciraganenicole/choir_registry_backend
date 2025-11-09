import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('louado_shifts')
@Unique(['date'])
export class LouadoShift {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'louangeId' })
  louange: User;

  @Column()
  louangeId: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'adorationId' })
  adoration: User;

  @Column()
  adorationId: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}

