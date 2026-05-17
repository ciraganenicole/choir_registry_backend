import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ContentType } from './content-type.entity';
import { Department } from '../users/department.entity';
import { User } from '../users/user.entity';
import { ContentStatus } from './enums/content-status.enum';
import { ContentVisibility } from './enums/content-visibility.enum';

@Entity('contents')
@Index('IDX_contents_linked', ['linkedEntityType', 'linkedEntityId'])
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ContentType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contentTypeId' })
  contentType: ContentType;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  fieldValues: Record<string, unknown>;

  @Column()
  linkedEntityType: string;

  @Column({ type: 'int' })
  linkedEntityId: number;

  @Column({
    type: 'varchar',
    length: 32,
    default: ContentStatus.DRAFT,
  })
  status: ContentStatus;

  @Column({
    type: 'varchar',
    length: 32,
    default: ContentVisibility.PRIVATE,
  })
  visibility: ContentVisibility;

  @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'audienceDepartmentId' })
  audienceDepartment: Department | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'authorId' })
  author: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approvedById' })
  approvedBy: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
