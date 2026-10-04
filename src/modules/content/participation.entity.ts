import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('participations')
export class Participation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  programmeId: string | null;

  @Column({ type: 'varchar', nullable: true })
  programmeTitle: string | null;

  @Column({ type: 'varchar', nullable: true })
  occurrenceDate: string | null;

  @Column({ type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar' })
  contact: string;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
