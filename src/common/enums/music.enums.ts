// Shared music-related enums to avoid duplication across modules

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

export enum SongDifficulty {
  EASY = 'Easy',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}
