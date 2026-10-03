import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ProgrammeGenerationService } from './programme-generation.service';
import {
  CHURCH_TIMEZONE,
  addDaysYmd,
  mondayOf,
  todayInChurchTz,
} from './schedule.util';

/**
 * Generates the dated Programme occurrences for the current and upcoming week.
 * Idempotent: already-generated weeks are skipped so admin edits/deletions
 * persist. Disable with PROGRAMMES_CRON_ENABLED=false.
 */
@Injectable()
export class ProgrammeSchedulerService {
  private readonly logger = new Logger(ProgrammeSchedulerService.name);

  constructor(
    private readonly generation: ProgrammeGenerationService,
  ) {}

  @Cron('0 6 * * *', { timeZone: CHURCH_TIMEZONE })
  async generateUpcomingWeeks(): Promise<void> {
    if (process.env.PROGRAMMES_CRON_ENABLED === 'false') return;
    try {
      const today = todayInChurchTz();
      const currentWeek = mondayOf(today);
      const nextWeek = addDaysYmd(currentWeek, 7);

      const current = await this.generation.generateWeek({
        weekStart: currentWeek,
      });
      const next = await this.generation.generateWeek({
        weekStart: nextWeek,
      });

      this.logger.log(
        `Programmes generated — current ${current.weekStart} (created ${current.created}, skipped ${current.skipped}); next ${next.weekStart} (created ${next.created}, skipped ${next.skipped})`,
      );
    } catch (error) {
      this.logger.error(
        `Programme generation failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
