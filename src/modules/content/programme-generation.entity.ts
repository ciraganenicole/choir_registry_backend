import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * Bookkeeping for weekly programme generation.
 * Prevents the scheduler from re-creating occurrences the admin deleted.
 */
@Entity('programme_generations')
export class ProgrammeGeneration {
  @PrimaryGeneratedColumn()
  id: number;

  /** Monday of the generated week (YYYY-MM-DD). */
  @Column({ type: 'date', unique: true })
  weekStart: string;

  @CreateDateColumn({ type: 'timestamptz' })
  generatedAt: Date;
}
