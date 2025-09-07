import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { Performance } from './performance.entity';
import { PerformanceSong } from './performance-song.entity';
import { PerformanceSongMusician } from './performance-song-musician.entity';
import { PerformanceVoicePart } from './performance-voice-part.entity';
import { Song } from '../song/song.entity';
import { User } from '../users/user.entity';
import { LeadershipShift } from '../leadership-shift/leadership-shift.entity';
import { LeadershipShiftModule } from '../leadership-shift/leadership-shift.module';
import { RehearsalModule } from '../rehearsal/rehearsal.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Performance,
      PerformanceSong,
      PerformanceSongMusician,
      PerformanceVoicePart,
      Song,
      User,
      LeadershipShift,
    ]),
    LeadershipShiftModule,
    RehearsalModule,
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
  exports: [PerformanceService],
})
export class PerformanceModule {} 