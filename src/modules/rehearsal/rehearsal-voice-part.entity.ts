import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { RehearsalSong } from './rehearsal-song.entity';
import { User } from '../users/user.entity';

export enum VoicePartType {
  SOPRANO = 'Soprano',
  ALTO = 'Alto',
  TENOR = 'Tenor',
  BASS = 'Bass',
  SOPRANO_1 = 'Soprano 1',
  SOPRANO_2 = 'Soprano 2',
  ALTO_1 = 'Alto 1',
  ALTO_2 = 'Alto 2',
  TENOR_1 = 'Tenor 1',
  TENOR_2 = 'Tenor 2',
  BASS_1 = 'Bass 1',
  BASS_2 = 'Bass 2',
  MEZZO_SOPRANO = 'Mezzo Soprano',
  BARITONE = 'Baritone',
  OTHER = 'Other',
}

@Entity('rehearsal_voice_parts')
export class RehearsalVoicePart {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RehearsalSong, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rehearsalSongId' })
  rehearsalSong: RehearsalSong;

  @Column({
    type: 'enum',
    enum: VoicePartType,
    enumName: 'voice_part_type_enum',
    default: VoicePartType.OTHER,
  })
  voicePartType: VoicePartType;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'rehearsal_voice_part_members',
    joinColumn: {
      name: 'rehearsalVoicePartId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
  })
  members: User[];

  @Column({ default: false })
  needsWork: boolean; // Whether this voice part needs more practice

  @Column({ type: 'text', nullable: true })
  focusPoints: string; // What to focus on for this voice part

  @Column({ type: 'text', nullable: true })
  notes: string; // Voice part specific notes

  @Column({ default: 1 })
  order: number; // Order of voice parts in the song

  @Column({ nullable: true })
  timeAllocated: number; // Time allocated for this voice part in minutes

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
