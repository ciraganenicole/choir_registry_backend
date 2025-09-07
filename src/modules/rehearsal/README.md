# Rehearsal Module

The Rehearsal module manages choir rehearsals with multiple songs, including detailed tracking of participants, musicians, and rehearsal-specific metadata for each song. This module serves as a "draft of performance" allowing choirs to plan, practice, and iterate before actual performances.

## 🎵 Features

- **Rehearsal Management**: Create, update, and delete rehearsals with multiple songs
- **Song-Specific Participants**: Track lead singers, chorus members, and musicians for each song
- **Musician Management**: Record musicians and their instruments per song with practice notes
- **Rehearsal Types**: Support for various rehearsal types (General Practice, Performance Prep, etc.)
- **Status Tracking**: Track rehearsal progress from Planning → In Progress → Completed
- **Template System**: Save common rehearsal setups for reuse
- **Statistics**: Comprehensive rehearsal analytics
- **Filtering & Search**: Advanced filtering and search capabilities
- **Performance Linking**: Connect rehearsals to target performances

## 📊 Database Schema

### Rehearsal Entity
```typescript
{
  id: number;
  title: string;                    // Rehearsal title
  date: Date;                       // Rehearsal date and time
  type: RehearsalType;              // Type of rehearsal
  status: RehearsalStatus;          // Current status
  location?: string;                // Optional location
  duration?: number;                // Duration in minutes
  targetPerformanceId?: number;     // Link to target performance
  isTemplate: boolean;              // Can be reused for future rehearsals
  notes?: string;                   // Additional notes
  objectives?: string;              // What to achieve in this rehearsal
  feedback?: string;                // Post-rehearsal feedback
  shiftLeadId?: number;             // Overall shift lead (optional)
  choirMembers: User[];             // General choir members for the rehearsal
  rehearsalSongs: RehearsalSong[];  // Songs in the rehearsal
  createdById?: number;             // Who created the rehearsal
  created_at: Date;
  updated_at: Date;
}
```

### RehearsalSong Entity
```typescript
{
  id: number;
  rehearsalId: number;              // Reference to rehearsal
  songId: number;                   // Reference to the song being rehearsed
  leadSinger: User[];                // Multiple lead singers for this specific song
  chorusMembers: User[];            // Chorus members for this specific song
  musicians: RehearsalSongMusician[]; // Musicians for this specific song
  difficulty: SongDifficulty;       // Song difficulty level
  needsWork: boolean;               // Whether this song needs more work
  order: number;                    // Order of songs in the rehearsal
  timeAllocated?: number;           // Time allocated in minutes
  focusPoints?: string;             // What to focus on during rehearsal
  notes?: string;                   // Song-specific notes
  musicalKey?: string;             // Musical key (gamme) for the song
  created_at: Date;
  updated_at: Date;
}
```

### RehearsalSongMusician Entity
```typescript
{
  id: number;
  rehearsalSongId: number;          // Reference to rehearsal song
  userId?: number;                  // User from the system (optional)
  musicianName?: string;            // External musician name (optional)
  instrument: string;               // Instrument being played
  musicianName?: string;            // External musician name (optional)
  role?: string;                    // Role description (e.g., "Lead Guitar", "Backup Vocals")
  notes?: string;                   // Musician-specific notes
  practiceNotes?: string;           // Specific practice requirements
  needsPractice: boolean;           // Whether this musician needs more practice
  isSoloist: boolean;               // Whether this musician has a solo part
  isAccompanist: boolean;           // Whether this musician is the main accompanist
  soloStartTime?: number;           // Start time of solo in seconds (if applicable)
  soloEndTime?: number;             // End time of solo in seconds (if applicable)
  soloNotes?: string;               // Notes about the solo part
  accompanimentNotes?: string;      // Notes about accompaniment
  order: number;                    // Order of musicians in the song
  timeAllocated?: number;           // Time allocated for this musician in minutes
  created_at: Date;
  updated_at: Date;
}
```

### RehearsalVoicePart Entity
```typescript
{
  id: number;
  rehearsalSongId: number;          // Reference to rehearsal song
  voicePartType: VoicePartType;     // Type of voice part (Soprano, Alto, Tenor, Bass, etc.)
  members: User[];                  // Members assigned to this voice part
  needsWork: boolean;               // Whether this voice part needs more practice
  focusPoints?: string;             // What to focus on for this voice part
  notes?: string;                   // Voice part specific notes
  order: number;                    // Order of voice parts in the song
  timeAllocated?: number;           // Time allocated for this voice part in minutes
  created_at: Date;
  updated_at: Date;
}
```

## 🎯 Rehearsal Types

- **General Practice**: Regular practice sessions
- **Performance Preparation**: Preparing for specific performances
- **Song Learning**: Learning new songs
- **Sectional Practice**: Practice for specific voice sections
- **Full Ensemble**: Full choir practice
- **Dress Rehearsal**: Final rehearsal before performance
- **Other**: Miscellaneous rehearsal types

## 🎵 Rehearsal Statuses

- **Planning**: Rehearsal is being planned
- **In Progress**: Rehearsal is currently happening
- **Completed**: Rehearsal has been completed
- **Cancelled**: Rehearsal was cancelled

## 🎤 Voice Part Types

- **Soprano**: High female voice
- **Alto**: Low female voice
- **Tenor**: High male voice
- **Bass**: Low male voice
- **Soprano 1/2**: First and second soprano parts
- **Alto 1/2**: First and second alto parts
- **Tenor 1/2**: First and second tenor parts
- **Bass 1/2**: First and second bass parts
- **Mezzo Soprano**: Middle female voice
- **Baritone**: Middle male voice
- **Other**: Custom voice part

## 🎵 Musical Keys

The system supports the following musical keys:
- **C, C#, D, D#, E, F, F#, G, G#, A, A#, B**

These simplified keys provide a clean, standardized approach to musical key notation.

## 🎹 Enhanced Instrument Types

- **Piano**: Acoustic and digital piano
- **Guitar**: Acoustic, electric, and bass guitar
- **Drums**: Full drum kit, snare, bass drum
- **Wind Instruments**: Flute, clarinet, saxophone, trumpet, trombone
- **String Instruments**: Violin, viola, cello, double bass
- **Percussion**: Conga drums, bongo drums, tambourine, maracas
- **Piano Accompaniment**: Designated piano accompanist
- **Conga Drums**: Afro-Cuban percussion
- **Bongo Drums**: Cuban percussion
- **Other**: Custom instruments

## 🎵 Enhanced Musician Features

- **Soloist Designation**: Mark musicians with solo parts
- **Solo Timing**: Track start and end times for solo sections
- **Solo Notes**: Detailed notes about solo performance
- **Accompanist Role**: Identify main accompanist for the song
- **Accompaniment Notes**: Specific notes for accompaniment
- **Practice Requirements**: Track which musicians need additional practice
- **Time Allocation**: Allocate specific time for each musician
- **Order Management**: Control the sequence of musicians
- **Custom Instruments**: Support for non-standard instruments
- **Musical Key Tracking**: Record the key (gamme) for each song
- **Multiple Lead Singers**: Support for multiple lead singers per song

## 🎯 Benefits of Enhanced Features

### Voice Part Management
- **Better Organization**: Clear structure for choir sections
- **Targeted Practice**: Focus on specific voice part needs
- **Progress Tracking**: Monitor improvement per voice section
- **Balanced Participation**: Ensure all voice parts are covered

### Enhanced Musician Tracking
- **Solo Performance**: Track solo parts with timing and notes
- **Accompaniment Focus**: Dedicated accompanist management
- **Practice Planning**: Identify and address practice needs
- **Time Optimization**: Efficient rehearsal time allocation
- **Role Clarity**: Clear designation of musician responsibilities

## 🔐 Authorization

### Required Roles
- **SUPER_ADMIN**: Full access to all rehearsals
- **LEAD**: Can create and manage rehearsals when on active shift

### Permission Rules
- Users can only update/delete rehearsals they created
- All users can view rehearsals they're involved in
- Admin users have full access to all rehearsals
- LEAD users must be on active shift to create/manage rehearsals

## 📋 API Endpoints

### Rehearsal Management
- `POST /rehearsals` - Create a new rehearsal with multiple songs
- `GET /rehearsals` - Get all rehearsals (with filtering)
- `GET /rehearsals/:id` - Get a specific rehearsal
- `PATCH /rehearsals/:id` - Update a rehearsal
- `DELETE /rehearsals/:id` - Delete a rehearsal

### Rehearsal Queries
- `GET /rehearsals/my-rehearsals` - Get current user's rehearsals
- `GET /rehearsals/by-song/:songId` - Get rehearsals that contain a specific song
- `GET /rehearsals/stats` - Get rehearsal statistics
- `GET /rehearsals/templates` - Get all rehearsal templates
- `GET /rehearsals/types` - Get all rehearsal types
- `GET /rehearsals/statuses` - Get all rehearsal statuses

### Template Operations
- `POST /rehearsals/from-template/:templateId` - Create rehearsal from template

## 🚀 Usage Examples

### Creating a Rehearsal with Multiple Songs
```typescript
const rehearsalData = {
  title: "Weekly Practice Session - Jan 15",
  date: "2024-01-15T18:00:00Z",
  type: "General Practice",
  location: "Choir Room",
  duration: 120,
  objectives: "Practice new songs and improve vocal technique",
  shiftLeadId: 456,
  choirMemberIds: [1, 2, 3, 4, 5],
  rehearsalSongs: [
    {
      songId: 1,
      leadSingerIds: [123, 124],
      chorusMemberIds: [1, 2, 3],
      difficulty: "Hard",
      needsWork: true,
      timeAllocated: 30,
      focusPoints: "Work on bridge section and final chorus",
      notes: "This song needs more work on the bridge section",
      musicalKey: "C",
      order: 1
    },
    {
      songId: 2,
      leadSingerIds: [125],
      chorusMemberIds: [2, 3, 4],
      difficulty: "Easy",
      needsWork: false,
      timeAllocated: 20,
      focusPoints: "Maintain good vocal blend",
      voiceParts: [
        {
          voicePartType: "Tenor",
          memberIds: [5, 6],
          needsWork: false,
          focusPoints: "Maintain vocal strength",
          timeAllocated: 10,
          order: 1
        },
        {
          voicePartType: "Bass",
          memberIds: [7, 8],
          needsWork: false,
          focusPoints: "Support harmony",
          timeAllocated: 10,
          order: 2
        }
      ],
      notes: "This song is ready for performance",
      order: 2
    }
  ],
  notes: "Focus on new material and vocal warm-ups"
};

const rehearsal = await api.post('/rehearsals', rehearsalData);
```

### Creating a Rehearsal from Template
```typescript
const templateData = {
  newDate: "2024-01-22T18:00:00Z",
  title: "Weekly Practice Session - Jan 22"
};

const rehearsal = await api.post('/rehearsals/from-template/123', templateData);
```

### Updating Rehearsal Status
```typescript
const updateData = {
  status: "In Progress",
  feedback: "Good progress on new songs, need more work on timing"
};

const rehearsal = await api.patch('/rehearsals/456', updateData);
```

### Filtering Rehearsals
```typescript
// Get rehearsals for a specific date range
const rehearsals = await api.get('/rehearsals', {
  params: {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    type: 'General Practice',
    status: 'Completed'
  }
});

// Get rehearsals for a specific song
const rehearsals = await api.get('/rehearsals', {
  params: {
    songId: 123
  }
});
```

### Getting Statistics
```typescript
const stats = await api.get('/rehearsals/stats');
// Returns:
// {
//   totalRehearsals: 25,
//   completedRehearsals: 20,
//   upcomingRehearsals: 5,
//   byType: {
//     "General Practice": 15,
//     "Performance Preparation": 5,
//     "Song Learning": 5
//   },
//   byStatus: {
//     "Planning": 3,
//     "In Progress": 2,
//     "Completed": 20
//   },
//   byMonth: {
//     "2024-01": 8,
//     "2024-02": 12
//   }
// }
```

## 🔄 Workflow

1. **Create Rehearsal Plan**: Set up rehearsal details and general participants
2. **Add Songs**: Select songs to be rehearsed
3. **Assign Song Roles**: Designate lead singers and chorus members for each song
4. **Organize Voice Parts**: Assign members to specific voice parts (Soprano, Alto, Tenor, Bass)
5. **Add Musicians**: Record musicians and their instruments for each song
6. **Configure Musician Roles**: Designate soloists and accompanists with timing and notes
7. **Set Musical Keys**: Specify the key (gamme) for each song
8. **Set Focus Points**: Define what to work on for each song
9. **Allocate Time**: Set time allocation for each song and voice part
10. **Conduct Rehearsal**: Mark rehearsal as "In Progress"
11. **Track Progress**: Monitor improvement across voice parts and musicians
12. **Record Feedback**: Add post-rehearsal feedback and notes
13. **Complete**: Mark rehearsal as "Completed"
14. **Iterate**: Use feedback to plan next rehearsal or promote to performance

## 🎵 Enhanced Instrument Management

### Instrument Types
The rehearsal module supports a comprehensive range of instruments:

#### **Keyboard Instruments**
- Piano, Organ, Keyboard, Synthesizer, Accordion
- **Piano Accompaniment**: Special designation for main accompanist

#### **String Instruments**
- Guitar (Acoustic/Electric), Bass, Bass Guitar
- Violin, Viola, Cello, Double Bass, Harp, Mandolin, Ukulele

#### **Wind Instruments**
- Flute, Piccolo, Clarinet, Oboe, Bassoon
- Trumpet, Trombone, French Horn
- Saxophone (Alto, Tenor, Baritone), Euphonium, Tuba

#### **Percussion Instruments**
- Drums, Drum Kit, Snare Drum, Bass Drum, Cymbals
- Tambourine, Maracas, Congas, Bongos, Timpani
- Xylophone, Glockenspiel, Chimes, Bells

#### **Other Instruments**
- Harmonica, Kalimba, Recorder, Pan Flute, Didgeridoo

### Musician Features
- **Soloist Management**: Track solo parts with timing and notes
- **Accompanist Designation**: Identify main accompanist
- **Practice Requirements**: Track who needs more practice
- **Time Allocation**: Allocate specific time for each musician
- **Order Management**: Control the sequence of musicians

## 🎵 Frontend Integration

### Required Components
1. **Rehearsal Form**: For creating/editing rehearsals with multiple songs
2. **Song Management**: Add/remove songs and their participants
3. **Voice Part Management**: Organize and assign members to voice parts
4. **Musician Management**: Add/remove musicians with detailed instrument and role information
5. **Rehearsal List**: Display rehearsals with filtering and status indicators
6. **Rehearsal Details**: Show detailed rehearsal information with songs, voice parts, and musicians
7. **Statistics Dashboard**: Display rehearsal analytics
8. **Calendar View**: Visual rehearsal scheduling
9. **Template Management**: Create and manage rehearsal templates

### Key Features to Implement
- **Date/Time Picker**: For rehearsal scheduling
- **Song Selection**: Choose multiple songs for the rehearsal
- **Participant Assignment**: Assign lead singers, chorus members per song
- **Voice Part Management**: Organize singers by voice parts (Soprano, Alto, Tenor, Bass)
- **Musician Management**: Add/remove musicians with instruments per song
- **Soloist Tracking**: Manage solo parts with timing and notes
- **Accompanist Designation**: Identify and manage main accompanist
- **Difficulty Tracking**: Mark songs as Easy/Medium/Hard
- **Progress Tracking**: Track which songs and voice parts need more work
- **Time Allocation**: Allocate specific time for different songs, voice parts, and musicians
- **Focus Points**: Define what to work on for each song and voice part
- **Status Management**: Update rehearsal status throughout the process
- **Template System**: Save and reuse rehearsal setups
- **Search & Filter**: Advanced filtering capabilities

## 🔧 Integration with Other Modules

### With Performance Module
- Link rehearsals to target performances
- Use rehearsal data to plan performances
- Track preparation progress for performances

### With Song Module
- Reference existing songs in rehearsals
- Track song difficulty and practice needs
- Monitor song improvement across rehearsals

### With Leadership Shift Module
- Verify LEAD users are on active shifts
- Link rehearsals to shift leads
- Manage rehearsal permissions

### With User Module
- Track choir members, lead singers, and musicians
- Manage user participation across rehearsals
- Monitor individual progress

## 📈 Statistics Features

### Rehearsal Analytics
- Total rehearsals count
- Completed vs upcoming rehearsals
- Rehearsal distribution by type and status
- Monthly rehearsal trends
- User participation statistics

### Song Progress Tracking
- Track which songs need more work
- Monitor improvement across rehearsals
- Time allocation analysis
- Focus point tracking
- Voice part progress monitoring
- Soloist and accompanist performance tracking
- Practice requirement analysis

### Enhanced Analytics
- **Voice Part Performance**: Track improvement per voice section
- **Musician Development**: Monitor soloist and accompanist progress
- **Practice Efficiency**: Analyze time allocation vs. improvement
- **Rehearsal Effectiveness**: Measure rehearsal outcomes by type
- **Participant Engagement**: Track individual participation patterns

### Template Usage
- Most used rehearsal templates
- Template effectiveness metrics
- Template customization patterns

### Enhanced Template Features
- **Voice Part Templates**: Save voice part configurations for reuse
- **Musician Arrangements**: Preserve successful musician setups
- **Soloist Patterns**: Template common soloist configurations
- **Accompanist Setups**: Standard accompanist arrangements
- **Time Allocation Patterns**: Proven time distribution strategies

## 🛠️ Development Notes

### Database Relationships
- Rehearsal → RehearsalSong (One-to-Many)
- RehearsalSong → Song (Many-to-One)
- RehearsalSong → User (Many-to-One for lead singer)
- RehearsalSong ↔ User (Many-to-Many for chorus members)
- RehearsalSong → RehearsalSongMusician (One-to-Many)
- RehearsalSong → RehearsalVoicePart (One-to-Many)
- RehearsalVoicePart ↔ User (Many-to-Many for voice part members)
- Rehearsal → User (Many-to-One for shift lead)
- Rehearsal ↔ User (Many-to-Many for general choir members)

### Performance Considerations
- Indexes on frequently queried fields (date, type, status, songId)
- Cascade deletes for related records
- Proper foreign key constraints
- Optimized queries for statistics

### Enhanced Musician and Voice Part Features
- **Voice Part Organization**: Soprano, Alto, Tenor, Bass with assigned members
- **Soloist Management**: Track solo parts with start/end timing and notes
- **Accompanist Designation**: Identify main accompanist with specific notes
- **Instrument Diversity**: Support for piano, drums, guitars, wind instruments, and custom instruments
- **Practice Requirements**: Track which musicians need additional practice
- **Time Allocation**: Allocate specific time for each musician and voice part
- **Order Management**: Control the sequence of musicians and voice parts
- **Detailed Notes**: Comprehensive notes for solo parts, accompaniment, and practice requirements

### Future Enhancements
- **Rehearsal Scheduling**: Automated scheduling with conflict detection
- **Attendance Tracking**: Track who attended each rehearsal
- **Progress Metrics**: Quantitative progress tracking
- **Integration with Calendar**: Sync with external calendar systems
- **Rehearsal Reports**: Detailed rehearsal analytics and reports
- **Mobile App Support**: Mobile-friendly rehearsal management
- **Notification System**: Reminders for upcoming rehearsals
- **Video Integration**: Link rehearsal recordings
- **Collaborative Notes**: Shared rehearsal notes and feedback
