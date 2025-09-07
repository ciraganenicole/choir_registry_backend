import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { PerformanceSong } from './performance-song.entity';
import { User } from '../users/user.entity';

export enum InstrumentType {
  // Keyboard Instruments
  PIANO = 'Piano',
  ORGAN = 'Organ',
  KEYBOARD = 'Keyboard',
  SYNTHESIZER = 'Synthesizer',
  ACCORDION = 'Accordion',
  PIANO_ACCOMPANIMENT = 'Piano Accompaniment',
  
  // String Instruments
  GUITAR = 'Guitar',
  ACOUSTIC_GUITAR = 'Acoustic Guitar',
  ELECTRIC_GUITAR = 'Electric Guitar',
  BASS = 'Bass',
  BASS_GUITAR = 'Bass Guitar',
  VIOLIN = 'Violin',
  VIOLA = 'Viola',
  CELLO = 'Cello',
  DOUBLE_BASS = 'Double Bass',
  HARP = 'Harp',
  MANDOLIN = 'Mandolin',
  UKULELE = 'Ukulele',
  
  // Wind Instruments
  FLUTE = 'Flute',
  PICCOLO = 'Piccolo',
  CLARINET = 'Clarinet',
  OBOE = 'Oboe',
  BASSOON = 'Bassoon',
  TRUMPET = 'Trumpet',
  TROMBONE = 'Trombone',
  FRENCH_HORN = 'French Horn',
  SAXOPHONE = 'Saxophone',
  ALTO_SAXOPHONE = 'Alto Saxophone',
  TENOR_SAXOPHONE = 'Tenor Saxophone',
  BARITONE_SAXOPHONE = 'Baritone Saxophone',
  EUPHONIUM = 'Euphonium',
  TUBA = 'Tuba',
  
  // Percussion Instruments
  DRUMS = 'Drums',
  DRUM_KIT = 'Drum Kit',
  SNARE_DRUM = 'Snare Drum',
  BASS_DRUM = 'Bass Drum',
  CYMBALS = 'Cymbals',
  TAMBOURINE = 'Tambourine',
  MARACAS = 'Maracas',
  CONGAS = 'Congas',
  BONGOS = 'Bongo',
  TIMPANI = 'Timpani',
  XYLOPHONE = 'Xylophone',
  GLOCKENSPIEL = 'Glockenspiel',
  CHIMES = 'Chimes',
  BELLS = 'Bells',
  CONGA_DRUMS = 'Conga Drums',
  BONGO_DRUMS = 'Bongo Drums',
  
  // Other Instruments
  HARMONICA = 'Harmonica',
  KALIMBA = 'Kalimba',
  RECORDER = 'Recorder',
  PAN_FLUTE = 'Pan Flute',
  DIDGERIDOO = 'Didgeridoo',
  
  // Custom/Other
  OTHER = 'Other',
}

@Entity('performance_song_musicians')
export class PerformanceSongMusician {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PerformanceSong, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'performanceSongId' })
  performanceSong: PerformanceSong;

  @Column()
  performanceSongId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  musicianName: string; // For external musicians not in the system

  @Column({ nullable: true })
  role: string; // Role description (e.g., "Lead Guitar", "Backup Vocals")

  @Column({
    type: 'enum',
    enum: InstrumentType,
    enumName: 'instrument_type_enum',
  })
  instrument: InstrumentType;



  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  practiceNotes: string;

  @Column({ default: false })
  needsPractice: boolean;

  @Column({ default: false })
  isSoloist: boolean;

  @Column({ default: false })
  isAccompanist: boolean;

  @Column({ nullable: true })
  soloStartTime: number; // Time in seconds

  @Column({ nullable: true })
  soloEndTime: number; // Time in seconds

  @Column({ type: 'text', nullable: true })
  soloNotes: string;

  @Column({ type: 'text', nullable: true })
  accompanimentNotes: string;

  @Column({ default: 1 })
  order: number;

  @Column({ nullable: true })
  timeAllocated: number; // Time allocated in minutes

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
