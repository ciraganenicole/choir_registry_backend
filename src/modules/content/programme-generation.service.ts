import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from './content.entity';
import { ContentType } from './content-type.entity';
import { ProgrammeGeneration } from './programme-generation.entity';
import { ContentStatus } from './enums/content-status.enum';
import { ContentVisibility } from './enums/content-visibility.enum';
import {
  addDaysYmd,
  mondayOf,
  normalizeRecurringPrograms,
  RecurringProgram,
  todayInChurchTz,
  weekdayInChurchTz,
} from './schedule.util';

export type GenerateWeekResult = {
  weekStart: string;
  alreadyGenerated: boolean;
  created: number;
  skipped: number;
};

const YMD = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class ProgrammeGenerationService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
    @InjectRepository(ContentType)
    private readonly contentTypeRepo: Repository<ContentType>,
    @InjectRepository(ProgrammeGeneration)
    private readonly generationRepo: Repository<ProgrammeGeneration>,
  ) {}

  private async getProgrammeType(): Promise<ContentType> {
    const type = await this.contentTypeRepo.findOne({
      where: { code: 'Programme' },
    });
    if (!type) {
      throw new NotFoundException('Content type "Programme" not found');
    }
    return type;
  }

  private async loadTemplates(): Promise<RecurringProgram[]> {
    const siteType = await this.contentTypeRepo.findOne({
      where: { code: 'ChurchSiteProfile' },
    });
    if (!siteType) return [];
    const site = await this.contentRepo.findOne({
      where: {
        contentType: { id: siteType.id },
        linkedEntityType: 'SiteProfile',
        linkedEntityId: 1,
        status: ContentStatus.PUBLISHED,
        visibility: ContentVisibility.PUBLIC,
      },
    });
    return normalizeRecurringPrograms(
      site?.fieldValues?.['recurringPrograms'],
    );
  }

  private async nextLinkedEntityId(typeId: number): Promise<number> {
    const raw = await this.contentRepo
      .createQueryBuilder('c')
      .select('COALESCE(MAX(c.linkedEntityId), 0)', 'max')
      .where('c.contentTypeId = :tid', { tid: typeId })
      .getRawOne<{ max: string }>();
    return Number(raw?.max ?? 0) + 1;
  }

  /** Monday of the upcoming week (1 week ahead) in church TZ. */
  nextWeekStart(today = todayInChurchTz()): string {
    return addDaysYmd(mondayOf(today), 7);
  }

  async isWeekGenerated(weekStart: string): Promise<boolean> {
    const row = await this.generationRepo.findOne({ where: { weekStart } });
    return Boolean(row);
  }

  /**
   * Create the dated Programme occurrences for a Monday–Sunday week from the
   * site profile's main programs. Existing rows are never modified and, unless
   * `force` is set, an already-generated week is left untouched so admin
   * deletions/edits stick.
   */
  async generateWeek(opts: {
    weekStart?: string;
    force?: boolean;
  } = {}): Promise<GenerateWeekResult> {
    const type = await this.getProgrammeType();
    const today = todayInChurchTz();
    const weekStart =
      opts.weekStart && YMD.test(opts.weekStart.trim())
        ? mondayOf(opts.weekStart.trim())
        : this.nextWeekStart(today);
    const force = opts.force === true;

    const marker = await this.generationRepo.findOne({ where: { weekStart } });
    if (marker && !force) {
      return { weekStart, alreadyGenerated: true, created: 0, skipped: 0 };
    }

    const templates = await this.loadTemplates();
    const weekEnd = addDaysYmd(weekStart, 6);

    const existing = await this.contentRepo
      .createQueryBuilder('c')
      .select(['c.id', 'c.fieldValues'])
      .where('c.contentTypeId = :tid', { tid: type.id })
      .andWhere('c.linkedEntityType = :lt', { lt: 'Programme' })
      .andWhere(`c."fieldValues"->>'date' BETWEEN :from AND :to`, {
        from: weekStart,
        to: weekEnd,
      })
      .getMany();
    const existingKeys = new Set(
      existing.map(
        (r) => `${r.fieldValues?.['sourceProgramId']}|${r.fieldValues?.['date']}`,
      ),
    );

    let nextLinkedId = await this.nextLinkedEntityId(type.id);
    let created = 0;
    let skipped = 0;

    for (let offset = 0; offset < 7; offset++) {
      const date = addDaysYmd(weekStart, offset);
      if (date < today) continue;
      const weekday = weekdayInChurchTz(date);
      for (const tpl of templates) {
        if (!tpl.isActive) continue;
        if (!tpl.daysOfWeek.includes(weekday)) continue;
        const key = `${tpl.id}|${date}`;
        if (existingKeys.has(key)) {
          skipped++;
          continue;
        }
        const row = this.contentRepo.create({
          contentType: type,
          linkedEntityType: 'Programme',
          linkedEntityId: nextLinkedId++,
          status: ContentStatus.PUBLISHED,
          visibility: ContentVisibility.PUBLIC,
          publishedAt: new Date(),
          fieldValues: {
            title: tpl.title,
            subtitle: tpl.subtitle,
            meta: tpl.meta,
            date,
            time: tpl.time,
            endTime: '',
            location: '',
            description: tpl.description,
            steps: tpl.steps,
            actionLabel: tpl.actionLabel,
            sourceProgramId: tpl.id,
            isCustom: false,
            displayOrder: 0,
          },
        });
        await this.contentRepo.save(row);
        existingKeys.add(key);
        created++;
      }
    }

    if (!marker) {
      await this.generationRepo.save(
        this.generationRepo.create({ weekStart }),
      );
    }

    return { weekStart, alreadyGenerated: false, created, skipped };
  }
}
