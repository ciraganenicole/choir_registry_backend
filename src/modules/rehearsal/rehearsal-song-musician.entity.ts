import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RehearsalSong } from './rehearsal-song.entity';
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

@Entity('rehearsal_song_musicians')
export class RehearsalSongMusician {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => RehearsalSong, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rehearsalSongId' })
  rehearsalSong: RehearsalSong;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  musicianName: string; // For external musicians not in the system

  @Column({ nullable: true })
  role: string; // Role description (e.g., "Lead Guitar", "Backup Vocals")

  @Column({
    type: 'character varying',
  })
  instrument: string; // Using string instead of enum to match migration



  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  practiceNotes: string; // Specific practice requirements

  @Column({ default: false })
  needsPractice: boolean; // Whether this musician needs more practice

  @Column({ default: false })
  isSoloist: boolean; // Whether this musician has a solo part

  @Column({ default: false })
  isAccompanist: boolean; // Whether this musician is the main accompanist

  @Column({ nullable: true })
  soloStartTime: number; // Start time of solo in seconds (if applicable)

  @Column({ nullable: true })
  soloEndTime: number; // End time of solo in seconds (if applicable)

  @Column({ type: 'text', nullable: true })
  soloNotes: string; // Notes about the solo part

  @Column({ type: 'text', nullable: true })
  accompanimentNotes: string; // Notes about accompaniment

  @Column({ default: 1 })
  order: number; // Order of musicians in the song

  @Column({ nullable: true })
  timeAllocated: number; // Time allocated for this musician in minutes

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;
}
