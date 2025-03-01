import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { AdminRole } from './admin-role.enum';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AdminRole })
  role: AdminRole;

  @CreateDateColumn()
  created_at: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
} 