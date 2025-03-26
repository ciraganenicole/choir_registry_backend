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
  username: string;

  @Column({ 
    type: 'varchar',
    enum: AdminRole,
    default: AdminRole.CHOIR_ADMIN
  })
  role: AdminRole;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ name: 'isActive', default: true })
  isActive: boolean;
} 