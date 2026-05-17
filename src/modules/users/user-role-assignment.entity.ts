import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';
import { Department } from './department.entity';

@Entity('user_role_assignments')
@Index('UQ_user_role_assignment_global', ['user', 'role'], {
  unique: true,
  where: '"departmentId" IS NULL',
})
@Index('UQ_user_role_assignment_scoped', ['user', 'role', 'department'], {
  unique: true,
  where: '"departmentId" IS NOT NULL',
})
export class UserRoleAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.roleAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Role, (role) => role.userAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @ManyToOne(() => Department, (dept) => dept.roleAssignments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'departmentId' })
  department: Department | null;

  @CreateDateColumn()
  createdAt: Date;
}
