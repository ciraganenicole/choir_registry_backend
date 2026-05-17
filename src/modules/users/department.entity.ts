import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRoleAssignment } from './user-role-assignment.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Department, (d) => d.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentDepartmentId' })
  parent: Department | null;

  @Column({ type: 'int', nullable: true })
  parentDepartmentId: number | null;

  @OneToMany(() => Department, (d) => d.parent)
  children: Department[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserRoleAssignment, (a) => a.department)
  roleAssignments: UserRoleAssignment[];
}
