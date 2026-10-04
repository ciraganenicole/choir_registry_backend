import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('program_reminders')
export class ProgramReminder {
  @PrimaryGeneratedColumn()
  id: number;

  /** Local (client) program item id, used to dedupe / delete. */
  @Index('IDX_program_reminders_clientId')
  @Column({ type: 'varchar', nullable: true })
  clientId: string | null;

  @Index('IDX_program_reminders_deviceId')
  @Column({ type: 'varchar', nullable: true })
  deviceId: string | null;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', nullable: true })
  programmeTitle: string | null;

  @Column({ type: 'date' })
  occurrenceDate: string;

  @Column({ type: 'varchar' })
  time: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', nullable: true })
  sourceRef: string | null;

  @Column({ type: 'varchar', nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', nullable: true })
  contact: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  notifiedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
