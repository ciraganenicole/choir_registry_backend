import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RehearsalController } from './rehearsal.controller';
import { RehearsalService } from './rehearsal.service';
import { Rehearsal } from './rehearsal.entity';
import { RehearsalSong } from './rehearsal-song.entity';
import { RehearsalSongMusician } from './rehearsal-song-musician.entity';
import { RehearsalVoicePart } from './rehearsal-voice-part.entity';
import { Song } from '../song/song.entity';
import { User } from '../users/user.entity';
import { LeadershipShift } from '../leadership-shift/leadership-shift.entity';
import { LeadershipShiftModule } from '../leadership-shift/leadership-shift.module';
import { Performance } from '../performance/performance.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rehearsal,
      RehearsalSong,
      RehearsalSongMusician,
      RehearsalVoicePart,
      Song,
      User,
      LeadershipShift,
      Performance,
    ]),
    LeadershipShiftModule,
  ],
  controllers: [RehearsalController],
  providers: [RehearsalService],
  exports: [RehearsalService],
})
export class RehearsalModule {}
