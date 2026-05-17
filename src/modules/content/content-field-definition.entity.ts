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
import { ContentFieldType } from './enums/content-field-type.enum';

@Entity('content_field_definitions')
@Index('UQ_content_field_definitions_type_key', ['contentType', 'fieldKey'], {
  unique: true,
})
export class ContentFieldDefinition {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ContentType, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'contentTypeId' })
  contentType: ContentType;

  @Column()
  fieldKey: string;

  @Column({
    type: 'varchar',
    length: 32,
  })
  fieldType: ContentFieldType;

  @Column({ type: 'varchar', nullable: true })
  label: string | null;

  @Column({ default: false })
  required: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: false })
  showInTable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  validation: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
