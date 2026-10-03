import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Content } from './content.entity';
import { ContentType } from './content-type.entity';
import { Song } from '../song/song.entity';
import { ContentStatus } from './enums/content-status.enum';
import { ContentVisibility } from './enums/content-visibility.enum';
import {
  PublicContentListQueryDto,
  PublicNotificationsQueryDto,
  PublicProgrammeQueryDto,
} from './dto/public-content-query.dto';
import {
  WEEKDAY_LABELS_FR,
  addDaysYmd,
  mondayOf,
  nowMinutesInChurchTz,
  resolveUpcomingSchedule,
  timeSortKey,
  todayInChurchTz,
  weekdayInChurchTz,
  type ResolvedSchedule,
} from './schedule.util';
import { ProgrammeGeneration } from './programme-generation.entity';
import { CommuniqueService } from '../communiques/communique.service';

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type PublicSongDto = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration: string;
};

export type PublicVideoDto = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  source: 'youtube' | 'url' | 'upload';
  videoId?: string;
  videoUrl?: string;
};

@Injectable()
export class PublicContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
    @InjectRepository(ContentType)
    private readonly contentTypeRepo: Repository<ContentType>,
    @InjectRepository(Song)
    private readonly songRepo: Repository<Song>,
    @InjectRepository(ProgrammeGeneration)
    private readonly generationRepo: Repository<ProgrammeGeneration>,
    private readonly communiqueService: CommuniqueService,
  ) {}

  private async getTypeByCode(code: string): Promise<ContentType> {
    const type = await this.contentTypeRepo.findOne({ where: { code } });
    if (!type) {
      throw new NotFoundException(`Content type "${code}" not found`);
    }
    return type;
  }

  private clampPagination(page?: number, limit?: number) {
    const p = Math.max(1, page ?? 1);
    const l = Math.min(50, Math.max(1, limit ?? 12));
    return { page: p, limit: l, skip: (p - 1) * l };
  }

  private asLines(v: unknown): string[] {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') {
      return v
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  }

  private truncDescription(desc: unknown, max = 220): string {
    const s = typeof desc === 'string' ? desc : '';
    if (s.length <= max) return s;
    return `${s.slice(0, max)}…`;
  }

  private resolveBodyHtml(fv: Record<string, unknown>): string {
    if (typeof fv['bodyHtml'] === 'string') {
      return fv['bodyHtml'];
    }
    const legacy = fv['bodyParagraphs'];
    if (Array.isArray(legacy)) {
      return legacy
        .filter((p): p is string => typeof p === 'string')
        .map((p) => `<p>${p}</p>`)
        .join('');
    }
    return '';
  }

  mapEventFull(c: Content) {
    const fv = c.fieldValues ?? {};
    return {
      id: c.id,
      slug: fv['slug'],
      title: fv['title'],
      dateLabel: fv['dateLabel'],
      startDate: fv['startDate'],
      endDate: fv['endDate'] ?? null,
      locationShort: fv['locationShort'],
      addressLines: this.asLines(fv['addressLines']),
      mapEmbedUrl: fv['mapEmbedUrl'] ?? '',
      image: fv['image'],
      summary: fv['summary'],
      bodyHtml: this.resolveBodyHtml(fv),
      program: fv['program'] ?? [],
      moderators: fv['moderators'] ?? [],
    };
  }

  mapEventSlim(c: Content) {
    const fv = c.fieldValues ?? {};
    return {
      id: c.id,
      slug: fv['slug'],
      title: fv['title'],
      dateLabel: fv['dateLabel'],
      startDate: fv['startDate'],
      endDate: fv['endDate'] ?? null,
      locationShort: fv['locationShort'],
      image: fv['image'],
      summary: fv['summary'],
    };
  }

  private parseSongIds(v: unknown): number[] {
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is number => typeof x === 'number' && Number.isInteger(x),
    );
  }

  private isLegacyInlineSongs(
    v: unknown,
  ): v is Array<{
    id?: string;
    title?: string;
    artist?: string;
    audioUrl?: string;
    duration?: string;
  }> {
    if (!Array.isArray(v) || v.length === 0) return false;
    const first = v[0];
    return (
      first != null &&
      typeof first === 'object' &&
      !Array.isArray(first) &&
      ('audioUrl' in first || 'artist' in first)
    );
  }

  private songToPublic(song: Song): PublicSongDto {
    return {
      id: String(song.id),
      title: song.title,
      artist: song.composer,
      audioUrl: song.audioUrl ?? '',
      duration: song.duration ?? '',
    };
  }

  async resolveDepartmentSongs(
    fieldValues: Record<string, unknown>,
  ): Promise<PublicSongDto[] | null> {
    const raw = fieldValues['songs'];

    if (this.isLegacyInlineSongs(raw)) {
      return raw.map((s) => ({
        id: String(s.id ?? ''),
        title: String(s.title ?? ''),
        artist: String(s.artist ?? ''),
        audioUrl: String(s.audioUrl ?? ''),
        duration: String(s.duration ?? ''),
      }));
    }

    const curatedIds = this.parseSongIds(raw);
    const rbacRaw = fieldValues['rbacDepartmentId'];
    const deptId =
      typeof rbacRaw === 'number'
        ? rbacRaw
        : rbacRaw != null
          ? Number(rbacRaw)
          : null;

    const orderedIds: number[] = [...curatedIds];
    const seen = new Set(curatedIds);

    if (deptId != null && Number.isFinite(deptId)) {
      const owned = await this.songRepo.find({
        where: { departmentId: deptId },
        order: { id: 'ASC' },
      });
      for (const s of owned) {
        if (!seen.has(s.id)) {
          orderedIds.push(s.id);
          seen.add(s.id);
        }
      }
    }

    if (orderedIds.length === 0) return null;

    const rows = await this.songRepo.find({ where: { id: In(orderedIds) } });
    const byId = new Map(rows.map((s) => [s.id, s]));
    const resolved = orderedIds
      .map((id) => byId.get(id))
      .filter((s): s is Song => s != null)
      .map((s) => this.songToPublic(s));

    return resolved.length > 0 ? resolved : null;
  }

  private parseJsonArray<T>(raw: unknown): T[] {
    if (Array.isArray(raw)) return raw as T[];
    if (typeof raw === 'string' && raw.trim()) {
      try {
        const p = JSON.parse(raw) as unknown;
        return Array.isArray(p) ? (p as T[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  normalizeVideoList(raw: unknown): PublicVideoDto[] {
    const items = this.parseJsonArray<Record<string, unknown>>(raw);
    const out: PublicVideoDto[] = [];
    for (const item of items) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const title = typeof item.title === 'string' ? item.title.trim() : '';
      const thumbnail =
        typeof item.thumbnail === 'string' ? item.thumbnail.trim() : '';
      const publishedAt =
        typeof item.publishedAt === 'string' ? item.publishedAt.trim() : '';
      const videoId =
        typeof item.videoId === 'string' ? item.videoId.trim() : '';
      const videoUrl =
        typeof item.videoUrl === 'string' ? item.videoUrl.trim() : '';
      let source =
        typeof item.source === 'string' ? item.source.trim() : '';
      if (!source && videoId) source = 'youtube';
      if (!title || !thumbnail || !publishedAt) continue;
      if (source === 'youtube') {
        if (!videoId) continue;
        out.push({
          id:
            typeof item.id === 'string' && item.id
              ? item.id
              : `vid-${out.length + 1}`,
          title,
          thumbnail,
          publishedAt,
          source: 'youtube',
          videoId,
        });
      } else if (source === 'url' || source === 'upload') {
        if (!videoUrl) continue;
        out.push({
          id:
            typeof item.id === 'string' && item.id
              ? item.id
              : `vid-${out.length + 1}`,
          title,
          thumbnail,
          publishedAt,
          source,
          videoUrl,
        });
      }
    }
    return out;
  }

  mapDepartmentFull(c: Content) {
    const fv = c.fieldValues ?? {};
    const pid = fv['parentDepartmentId'];
    return {
      id: c.id,
      slug: fv['slug'],
      name: fv['name'],
      description: fv['description'],
      image: fv['image'],
      parentDepartmentId:
        typeof pid === 'number' ? pid : pid != null ? Number(pid) : null,
      responsables: fv['responsables'] ?? [],
      gallery: fv['gallery'] ?? [],
      songs: null as PublicSongDto[] | null,
      videos: null as PublicVideoDto[] | null,
      subDepartmentSlugs: [] as string[],
      eventSlugs: fv['eventSlugs'] ?? [],
    };
  }

  private async resolveSubDepartmentSlugs(
    parentLinkedEntityId: number,
    departmentTypeId: number,
  ): Promise<string[]> {
    const rows = await this.contentRepo
      .createQueryBuilder('c')
      .select(['c.fieldValues'])
      .where('c.contentTypeId = :tid', { tid: departmentTypeId })
      .andWhere('c.linkedEntityType = :lt', { lt: 'DepartmentPage' })
      .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .andWhere(
        `(c."fieldValues"->>'parentDepartmentId')::int = :pid`,
        { pid: parentLinkedEntityId },
      )
      .orderBy(`c."fieldValues"->>'name'`, 'ASC')
      .getMany();

    return rows
      .map((r) => {
        const slug = r.fieldValues?.['slug'];
        return typeof slug === 'string' && slug.trim() ? slug.trim() : null;
      })
      .filter((s): s is string => Boolean(s));
  }

  mapDepartmentSlim(c: Content) {
    const fv = c.fieldValues ?? {};
    const pid = fv['parentDepartmentId'];
    return {
      id: c.id,
      slug: fv['slug'],
      name: fv['name'],
      description: this.truncDescription(fv['description']),
      image: fv['image'],
      parentDepartmentId:
        typeof pid === 'number' ? pid : pid != null ? Number(pid) : null,
    };
  }

  async listPublishedEvents(
    q: PublicContentListQueryDto,
  ): Promise<PaginatedResult<ReturnType<PublicContentService['mapEventSlim']>>> {
    const type = await this.getTypeByCode('ChurchEvent');
    const { page, limit, skip } = this.clampPagination(q.page, q.limit);
    const qb = this.contentRepo
      .createQueryBuilder('c')
      .select(['c.id', 'c.fieldValues', 'c.updatedAt'])
      .where('c.contentTypeId = :tid', { tid: type.id })
      .andWhere('c.linkedEntityType = :lt', { lt: 'Event' })
      .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .orderBy('c.updatedAt', 'DESC')
      .skip(skip)
      .take(limit);
    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((r) => this.mapEventSlim(r)),
      total,
      page,
      limit,
    };
  }

  async getPublishedEventBySlug(slug: string) {
    const type = await this.getTypeByCode('ChurchEvent');
    const row = await this.contentRepo
      .createQueryBuilder('c')
      .where('c.contentTypeId = :tid', { tid: type.id })
      .andWhere('c.linkedEntityType = :lt', { lt: 'Event' })
      .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .andWhere(`c."fieldValues"->>'slug' = :slug`, { slug })
      .getOne();
    if (!row) {
      throw new NotFoundException('Event not found');
    }
    return this.mapEventFull(row);
  }

  async listPublishedDepartments(
    q: PublicContentListQueryDto,
  ): Promise<
    PaginatedResult<ReturnType<PublicContentService['mapDepartmentSlim']>>
  > {
    const type = await this.getTypeByCode('DepartmentPage');
    const { page, limit, skip } = this.clampPagination(q.page, q.limit);
    const qb = this.contentRepo
      .createQueryBuilder('c')
      .select(['c.id', 'c.fieldValues', 'c.updatedAt'])
      .where('c.contentTypeId = :tid', { tid: type.id })
      .andWhere('c.linkedEntityType = :lt', { lt: 'DepartmentPage' })
      .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .orderBy('c.updatedAt', 'DESC')
      .skip(skip)
      .take(limit);
    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((r) => this.mapDepartmentSlim(r)),
      total,
      page,
      limit,
    };
  }

  async getPublishedDepartmentBySlug(slug: string) {
    const type = await this.getTypeByCode('DepartmentPage');
    const row = await this.contentRepo
      .createQueryBuilder('c')
      .where('c.contentTypeId = :tid', { tid: type.id })
      .andWhere('c.linkedEntityType = :lt', { lt: 'DepartmentPage' })
      .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .andWhere(`c."fieldValues"->>'slug' = :slug`, { slug })
      .getOne();
    if (!row) {
      throw new NotFoundException('Department not found');
    }
    const base = this.mapDepartmentFull(row);
    const fv = row.fieldValues ?? {};
    const songs = await this.resolveDepartmentSongs(fv);
    const videos = this.normalizeVideoList(fv['videos']);
    const subDepartmentSlugs = await this.resolveSubDepartmentSlugs(
      row.linkedEntityId,
      type.id,
    );
    return {
      ...base,
      subDepartmentSlugs,
      songs,
      videos: videos.length > 0 ? videos : null,
    };
  }

  async getSiteProfile() {
    const type = await this.getTypeByCode('ChurchSiteProfile');
    const row = await this.contentRepo.findOne({
      where: {
        contentType: { id: type.id },
        linkedEntityType: 'SiteProfile',
        linkedEntityId: 1,
        status: ContentStatus.PUBLISHED,
        visibility: ContentVisibility.PUBLIC,
      },
    });
    if (!row) {
      throw new NotFoundException('Site profile not found');
    }
    const fv = row.fieldValues ?? {};
    return {
      churchName: fv['churchName'],
      tagline: fv['tagline'],
      aboutHtml: fv['aboutHtml'],
      address: fv['address'],
      serviceTimesHtml: fv['serviceTimesHtml'],
      contactEmail: fv['contactEmail'],
      contactPhone: fv['contactPhone'],
      socialLinks: fv['socialLinks'] ?? [],
      heroImage: fv['heroImage'],
      programsHeadline: fv['programsHeadline'] ?? '',
      programsIntro: fv['programsIntro'] ?? '',
      weeklyPrograms: fv['weeklyPrograms'] ?? [],
      contactHeadline: fv['contactHeadline'] ?? '',
      contactIntro: fv['contactIntro'] ?? '',
      mapEmbedUrl: fv['mapEmbedUrl'] ?? '',
      homeCellsIntro: fv['homeCellsIntro'] ?? '',
      homeCells: fv['homeCells'] ?? [],
      seoDefaults: fv['seoDefaults'] ?? {},
      pastorQuote: typeof fv['pastorQuote'] === 'string' ? fv['pastorQuote'] : '',
      pastorMessage:
        typeof fv['pastorMessage'] === 'string' ? fv['pastorMessage'] : '',
      pastorName: typeof fv['pastorName'] === 'string' ? fv['pastorName'] : '',
      pastorRole: typeof fv['pastorRole'] === 'string' ? fv['pastorRole'] : '',
      visionTitle: typeof fv['visionTitle'] === 'string' ? fv['visionTitle'] : '',
      visionSummary:
        typeof fv['visionSummary'] === 'string' ? fv['visionSummary'] : '',
      visionParagraphs: this.asLines(fv['visionParagraphs']),
      departmentsIntroTitle:
        typeof fv['departmentsIntroTitle'] === 'string'
          ? fv['departmentsIntroTitle']
          : '',
      departmentsIntroSummary:
        typeof fv['departmentsIntroSummary'] === 'string'
          ? fv['departmentsIntroSummary']
          : '',
      departmentsIntroParagraphs: this.asLines(fv['departmentsIntroParagraphs']),
      responsablesTitle:
        typeof fv['responsablesTitle'] === 'string'
          ? fv['responsablesTitle']
          : '',
      responsablesSummary:
        typeof fv['responsablesSummary'] === 'string'
          ? fv['responsablesSummary']
          : '',
      responsablesParagraphs: this.asLines(fv['responsablesParagraphs']),
      churchLeaders: Array.isArray(fv['churchLeaders'])
        ? fv['churchLeaders']
        : [],
      historyTitle:
        typeof fv['historyTitle'] === 'string' ? fv['historyTitle'] : '',
      historySummary:
        typeof fv['historySummary'] === 'string' ? fv['historySummary'] : '',
      historyParagraphs: this.asLines(fv['historyParagraphs']),
      galleryEyebrow:
        typeof fv['galleryEyebrow'] === 'string' ? fv['galleryEyebrow'] : '',
      galleryTitle:
        typeof fv['galleryTitle'] === 'string' ? fv['galleryTitle'] : '',
      galleryItems: this.mapGalleryItems(fv['galleryItems']),
      communityEyebrow:
        typeof fv['communityEyebrow'] === 'string' ? fv['communityEyebrow'] : '',
      communityTitle:
        typeof fv['communityTitle'] === 'string' ? fv['communityTitle'] : '',
      communityIntro:
        typeof fv['communityIntro'] === 'string' ? fv['communityIntro'] : '',
      liveChannelUrl:
        typeof fv['liveChannelUrl'] === 'string' ? fv['liveChannelUrl'] : '',
      livePageTitle:
        typeof fv['livePageTitle'] === 'string' ? fv['livePageTitle'] : '',
      visitEyebrow:
        typeof fv['visitEyebrow'] === 'string' ? fv['visitEyebrow'] : '',
      visitTitle:
        typeof fv['visitTitle'] === 'string' ? fv['visitTitle'] : '',
      visitBody: typeof fv['visitBody'] === 'string' ? fv['visitBody'] : '',
      visitCtaLabel:
        typeof fv['visitCtaLabel'] === 'string' ? fv['visitCtaLabel'] : '',
      visitCtaHref:
        typeof fv['visitCtaHref'] === 'string' ? fv['visitCtaHref'] : '',
    };
  }

  private mapGalleryItems(v: unknown) {
    if (!Array.isArray(v)) return [];
    return v
      .filter((item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
      .map((o) => ({
        imageUrl: typeof o.imageUrl === 'string' ? o.imageUrl : '',
        caption: typeof o.caption === 'string' ? o.caption : '',
        alt: typeof o.alt === 'string' ? o.alt : '',
        large: o.large === true,
      }))
      .filter((item) => item.imageUrl);
  }

  private mapParticipationSteps(v: unknown) {
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
      .map((o) => ({
        title: typeof o.title === 'string' ? o.title : String(o.title ?? ''),
        description:
          typeof o.description === 'string'
            ? o.description
            : String(o.description ?? ''),
      }))
      .filter((s) => s.title.trim().length > 0);
  }

  mapProgramme(c: Content) {
    const fv = c.fieldValues ?? {};
    return {
      id: c.id,
      title: this.stringField(fv['title']),
      subtitle: this.stringField(fv['subtitle']),
      meta: this.stringField(fv['meta']),
      date: this.stringField(fv['date']),
      time: this.stringField(fv['time']),
      endTime: this.stringField(fv['endTime']),
      location: this.stringField(fv['location']),
      description: this.stringField(fv['description']),
      steps: this.mapParticipationSteps(fv['steps']),
      actionLabel: this.stringField(fv['actionLabel']),
      isCustom: fv['isCustom'] === true,
      sourceProgramId: this.stringField(fv['sourceProgramId']),
    };
  }

  async getPublicProgrammes(q: PublicProgrammeQueryDto) {
    const from =
      q.from && /^\d{4}-\d{2}-\d{2}$/.test(q.from)
        ? q.from
        : todayInChurchTz();
    const to =
      q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to) ? q.to : addDaysYmd(from, 34);
    const type = await this.contentTypeRepo.findOne({
      where: { code: 'Programme' },
    });
    if (!type) {
      return { items: [], total: 0, from, to };
    }
    const rows = await this.contentRepo
      .createQueryBuilder('c')
      .select(['c.id', 'c.fieldValues', 'c.updatedAt'])
      .where('c.contentTypeId = :tid', { tid: type.id })
      .andWhere('c.linkedEntityType = :lt', { lt: 'Programme' })
      .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .andWhere(`c."fieldValues"->>'date' BETWEEN :from AND :to`, { from, to })
      .getMany();
    const items = rows
      .map((r) => this.mapProgramme(r))
      .filter((p) => p.date)
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      );
    return { items, total: items.length, from, to };
  }

  private hasGeneratedWeekCovering(
    fromYmd: string,
    toYmd: string,
  ): Promise<boolean> {
    return this.generationRepo
      .createQueryBuilder('g')
      .where('g.weekStart BETWEEN :from AND :to', {
        from: mondayOf(fromYmd),
        to: toYmd,
      })
      .getCount()
      .then((n) => n > 0);
  }

  private programmeToResolved(
    p: ReturnType<PublicContentService['mapProgramme']>,
  ) {
    const weekday = weekdayInChurchTz(p.date);
    const weekdayLabel = WEEKDAY_LABELS_FR[weekday];
    const capitalized =
      weekdayLabel.charAt(0).toUpperCase() + weekdayLabel.slice(1);
    const title =
      p.meta && p.meta.includes('·') ? p.meta : `${capitalized} · ${p.time}`;
    return {
      id: String(p.id),
      source: 'programme' as const,
      programId: p.sourceProgramId || null,
      meta: p.meta || 'PROGRAMME',
      title,
      subtitle: [p.subtitle, p.location].filter(Boolean).join(' · '),
      time: p.time,
      action: p.actionLabel || 'Comment participer',
      description: p.description,
      steps: p.steps,
      occurrenceDate: p.date,
      weekday,
      weekdayLabel,
      programTitle: p.title,
    };
  }

  private mapResolvedScheduleResponse(resolved: ResolvedSchedule) {
    const next = resolved.nextGathering;
    return {
      date: resolved.date,
      weekday: resolved.weekday,
      weekdayLabel: resolved.weekdayLabel,
      nextGathering: next
        ? {
            date: next.date,
            weekday: next.weekday,
            weekdayLabel: next.weekdayLabel,
            time: next.time,
            headline: next.headline,
            title: next.title,
            subtitle: next.subtitle,
            meta: next.meta,
          }
        : null,
      items: resolved.items.map((item, index) => ({
        number: String(index + 1).padStart(2, '0'),
        id: `${item.occurrenceDate}:${item.id}`,
        source: item.source,
        meta: item.meta,
        title: item.title,
        subtitle: item.subtitle,
        time: item.time,
        action: item.action,
        occurrenceDate: item.occurrenceDate,
        weekdayLabel: item.weekdayLabel,
        programTitle: item.programTitle,
        drawer: {
          eyebrow: item.meta,
          title: item.programTitle || item.title,
          lead:
            item.description ||
            'Vous êtes les bienvenus. Voici comment participer simplement.',
          steps:
            item.steps.length > 0
              ? item.steps
              : [
                  {
                    title: 'Venez comme vous êtes',
                    description: item.subtitle || 'CELPA Salem',
                  },
                ],
          actions: [
            {
              label: 'Je veux venir',
              href: '#premiere-visite',
              variant: 'green',
            },
            {
              label: 'Voir le programme',
              href: '#enseignements',
              variant: 'textLink',
            },
          ],
        },
      })),
    };
  }

  async getTodaySchedule(date?: string) {
    const useLiveClock = !(
      typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())
    );
    const dateYmd = useLiveClock ? todayInChurchTz() : date!.trim();
    const fromTimeMinutes = useLiveClock ? nowMinutesInChurchTz() : 0;
    const windowEnd = addDaysYmd(dateYmd, 13);

    // Prefer explicit dated Programme entries.
    const type = await this.contentTypeRepo.findOne({
      where: { code: 'Programme' },
    });
    let programmeItems: ReturnType<PublicContentService['mapProgramme']>[] = [];
    if (type) {
      const rows = await this.contentRepo
        .createQueryBuilder('c')
        .select(['c.id', 'c.fieldValues', 'c.updatedAt'])
        .where('c.contentTypeId = :tid', { tid: type.id })
        .andWhere('c.linkedEntityType = :lt', { lt: 'Programme' })
        .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
        .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
        .andWhere(`c."fieldValues"->>'date' BETWEEN :from AND :to`, {
          from: dateYmd,
          to: windowEnd,
        })
        .getMany();
      programmeItems = rows
        .map((r) => this.mapProgramme(r))
        .filter((p) => p.date)
        .filter(
          (p) =>
            !(
              useLiveClock &&
              p.date === dateYmd &&
              timeSortKey(p.time) < fromTimeMinutes
            ),
        )
        .sort((a, b) =>
          `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
        )
        .slice(0, 4);
    }

    if (programmeItems.length > 0) {
      const resolvedItems = programmeItems.map((p) =>
        this.programmeToResolved(p),
      );
      const first = resolvedItems[0];
      const capitalized =
        first.weekdayLabel.charAt(0).toUpperCase() +
        first.weekdayLabel.slice(1);
      const resolved: ResolvedSchedule = {
        date: dateYmd,
        weekday: weekdayInChurchTz(dateYmd),
        weekdayLabel: WEEKDAY_LABELS_FR[weekdayInChurchTz(dateYmd)],
        items: resolvedItems,
        nextGathering: {
          date: first.occurrenceDate,
          weekday: first.weekday,
          weekdayLabel: first.weekdayLabel,
          time: first.time,
          headline: `${capitalized}, ${first.time}`,
          title: first.programTitle,
          subtitle: first.subtitle,
          meta: first.meta,
        },
      };
      return this.mapResolvedScheduleResponse(resolved);
    }

    // Fall back to the main-programs template only for ungenerated weeks.
    const generated = await this.hasGeneratedWeekCovering(dateYmd, windowEnd);
    if (!generated) {
      const siteType = await this.getTypeByCode('ChurchSiteProfile');
      const row = await this.contentRepo.findOne({
        where: {
          contentType: { id: siteType.id },
          linkedEntityType: 'SiteProfile',
          linkedEntityId: 1,
          status: ContentStatus.PUBLISHED,
          visibility: ContentVisibility.PUBLIC,
        },
      });
      const fv = row?.fieldValues ?? {};
      const resolved = resolveUpcomingSchedule(
        dateYmd,
        fv['recurringPrograms'],
        fv['scheduleOverrides'],
        { limit: 4, fromTimeMinutes },
      );
      return this.mapResolvedScheduleResponse(resolved);
    }

    // Week generated but empty (occurrences deleted by the admin).
    return {
      date: dateYmd,
      weekday: weekdayInChurchTz(dateYmd),
      weekdayLabel: WEEKDAY_LABELS_FR[weekdayInChurchTz(dateYmd)],
      nextGathering: null,
      items: [],
    };
  }

  async getDonationSettings() {
    const type = await this.getTypeByCode('DonationSettings');
    const row = await this.contentRepo.findOne({
      where: {
        contentType: { id: type.id },
        linkedEntityType: 'DonationSettings',
        linkedEntityId: 1,
        status: ContentStatus.PUBLISHED,
        visibility: ContentVisibility.PUBLIC,
      },
    });
    if (!row) {
      throw new NotFoundException('Donation settings not found');
    }
    const fv = row.fieldValues ?? {};
    const percentRaw = fv['spotlightPercent'];
    const spotlightPercent =
      typeof percentRaw === 'number'
        ? percentRaw
        : typeof percentRaw === 'string'
          ? Number.parseFloat(percentRaw)
          : 0;
    return {
      headline: fv['headline'],
      bodyHtml: fv['bodyHtml'],
      methods: fv['methods'] ?? [],
      legalNoticeHtml: fv['legalNoticeHtml'],
      receiptContact: fv['receiptContact'],
      spotlightEyebrow:
        typeof fv['spotlightEyebrow'] === 'string'
          ? fv['spotlightEyebrow']
          : '',
      spotlightTitle:
        typeof fv['spotlightTitle'] === 'string' ? fv['spotlightTitle'] : '',
      spotlightDescription:
        typeof fv['spotlightDescription'] === 'string'
          ? fv['spotlightDescription']
          : '',
      spotlightPhase:
        typeof fv['spotlightPhase'] === 'string' ? fv['spotlightPhase'] : '',
      spotlightPercent: Number.isFinite(spotlightPercent)
        ? Math.max(0, Math.min(100, spotlightPercent))
        : 0,
      spotlightImage:
        typeof fv['spotlightImage'] === 'string' ? fv['spotlightImage'] : '',
    };
  }

  private mapScripture(v: unknown): { text: string; reference: string } {
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
      return { text: '', reference: '' };
    }
    const o = v as Record<string, unknown>;
    return {
      text: typeof o.text === 'string' ? o.text : '',
      reference: typeof o.reference === 'string' ? o.reference : '',
    };
  }

  private mapTeachingJourney(v: unknown) {
    if (!Array.isArray(v)) return [];
    return v
      .filter((item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object' && !Array.isArray(item),
      )
      .map((o) => ({
        key: typeof o.key === 'string' ? o.key : '',
        label: typeof o.label === 'string' ? o.label : '',
        statement: typeof o.statement === 'string' ? o.statement : '',
        guidance: typeof o.guidance === 'string' ? o.guidance : '',
        actionLabel: typeof o.actionLabel === 'string' ? o.actionLabel : '',
        ...(typeof o.hasNote === 'boolean' ? { hasNote: o.hasNote } : {}),
        ...(typeof o.notePlaceholder === 'string'
          ? { notePlaceholder: o.notePlaceholder }
          : {}),
      }))
      .filter((s) => s.key && s.label && s.statement);
  }

  mapTeachingSlim(c: Content) {
    const fv = c.fieldValues ?? {};
    const titleLines = this.asLines(fv['titleLines']);
    const title =
      typeof fv['title'] === 'string' && fv['title']
        ? fv['title']
        : titleLines.join(' ') || '';
    return {
      id: c.id,
      slug: typeof fv['slug'] === 'string' ? fv['slug'] : '',
      category: typeof fv['category'] === 'string' ? fv['category'] : '',
      title,
      titleLines: titleLines.length > 0 ? titleLines : title ? [title] : [],
      pastor: typeof fv['pastor'] === 'string' ? fv['pastor'] : '',
      duration: typeof fv['duration'] === 'string' ? fv['duration'] : '',
      reference: typeof fv['reference'] === 'string' ? fv['reference'] : '',
      date: typeof fv['date'] === 'string' ? fv['date'] : '',
      summary: typeof fv['summary'] === 'string' ? fv['summary'] : '',
      essentialIdea:
        typeof fv['essentialIdea'] === 'string' ? fv['essentialIdea'] : '',
      scripture: this.mapScripture(fv['scripture']),
      coverImage:
        typeof fv['coverImage'] === 'string' ? fv['coverImage'] : '',
    };
  }

  mapTeachingFull(c: Content) {
    const slim = this.mapTeachingSlim(c);
    const fv = c.fieldValues ?? {};
    return {
      ...slim,
      overviewTitle:
        typeof fv['overviewTitle'] === 'string' ? fv['overviewTitle'] : '',
      overviewParagraph:
        typeof fv['overviewParagraph'] === 'string'
          ? fv['overviewParagraph']
          : '',
      journey: this.mapTeachingJourney(fv['journey']),
    };
  }

  async listPublishedTeachings(
    q: PublicContentListQueryDto,
  ): Promise<
    PaginatedResult<ReturnType<PublicContentService['mapTeachingSlim']>>
  > {
    const type = await this.getTypeByCode('Teaching');
    const { page, limit, skip } = this.clampPagination(q.page, q.limit);
    const qb = this.contentRepo
      .createQueryBuilder('c')
      .select(['c.id', 'c.fieldValues', 'c.updatedAt'])
      .where('c.contentTypeId = :tid', { tid: type.id })
      .andWhere('c.linkedEntityType = :lt', { lt: 'Teaching' })
      .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .orderBy('c.updatedAt', 'DESC')
      .skip(skip)
      .take(limit);
    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((r) => this.mapTeachingSlim(r)),
      total,
      page,
      limit,
    };
  }

  async getPublishedTeachingBySlug(slug: string) {
    const type = await this.getTypeByCode('Teaching');
    const row = await this.contentRepo
      .createQueryBuilder('c')
      .where('c.contentTypeId = :tid', { tid: type.id })
      .andWhere('c.linkedEntityType = :lt', { lt: 'Teaching' })
      .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .andWhere(`c."fieldValues"->>'slug' = :slug`, { slug })
      .getOne();
    if (!row) {
      throw new NotFoundException('Teaching not found');
    }
    return this.mapTeachingFull(row);
  }

  private numericField(v: unknown): number {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = Number.parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  }

  private stringField(v: unknown): string {
    return typeof v === 'string' ? v : '';
  }

  mapCommunityUpdate(c: Content) {
    const fv = c.fieldValues ?? {};
    return {
      id: c.id,
      meta: this.stringField(fv['meta']),
      tone: this.stringField(fv['tone']),
      title: this.stringField(fv['title']),
      description: this.stringField(fv['description']),
      ctaLabel: this.stringField(fv['ctaLabel']),
      ctaVariant: this.stringField(fv['ctaVariant']),
      href: this.stringField(fv['href']),
      displayOrder: this.numericField(fv['displayOrder']),
    };
  }

  async listPublishedCommunityUpdates(q: PublicContentListQueryDto) {
    const type = await this.getTypeByCode('CommunityUpdate');
    const { page, limit, skip } = this.clampPagination(q.page, q.limit);
    const qb = this.contentRepo
      .createQueryBuilder('c')
      .select(['c.id', 'c.fieldValues', 'c.updatedAt'])
      .where('c.contentTypeId = :tid', { tid: type.id })
      .andWhere('c.linkedEntityType = :lt', { lt: 'CommunityUpdate' })
      .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .orderBy(`COALESCE((c."fieldValues"->>'displayOrder')::numeric, 0)`, 'ASC')
      .addOrderBy('c.id', 'ASC')
      .skip(skip)
      .take(limit);
    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((r) => this.mapCommunityUpdate(r)),
      total,
      page,
      limit,
    };
  }

  mapLiveEvent(c: Content) {
    const fv = c.fieldValues ?? {};
    const startSeconds = this.numericField(fv['startSeconds']);
    return {
      id: String(c.id),
      title: this.stringField(fv['title']),
      videoId: this.stringField(fv['videoId']),
      thumbnail: this.stringField(fv['thumbnail']),
      publishedAt: this.stringField(fv['publishedAt']),
      ...(startSeconds > 0 ? { startSeconds } : {}),
      displayOrder: this.numericField(fv['displayOrder']),
    };
  }

  async listPublishedLiveEvents(q: PublicContentListQueryDto) {
    const type = await this.getTypeByCode('LiveEvent');
    const { page, limit, skip } = this.clampPagination(q.page, q.limit);
    const qb = this.contentRepo
      .createQueryBuilder('c')
      .select(['c.id', 'c.fieldValues', 'c.updatedAt'])
      .where('c.contentTypeId = :tid', { tid: type.id })
      .andWhere('c.linkedEntityType = :lt', { lt: 'LiveEvent' })
      .andWhere('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .orderBy(`COALESCE((c."fieldValues"->>'displayOrder')::numeric, 0)`, 'ASC')
      .addOrderBy('c.id', 'ASC')
      .skip(skip)
      .take(limit);
    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows.map((r) => this.mapLiveEvent(r)),
      total,
      page,
      limit,
    };
  }

  private defaultNotificationTag(kind: string): string {
    switch (kind) {
      case 'teaching':
        return 'Enseignements';
      case 'event':
        return 'Vie de l’Église';
      case 'community':
        return 'Communauté';
      default:
        return 'Annonces';
    }
  }

  async getPublicNotifications(q: PublicNotificationsQueryDto) {
    const { limit } = this.clampPagination(1, q.limit ?? 50);
    const items: Array<{
      id: string;
      kind: 'announcement' | 'teaching' | 'event' | 'community';
      source: 'communique' | 'content';
      title: string;
      message: string;
      attachmentUrl: string;
      ctaLabel: string;
      ctaHref: string;
      tag: string;
      href: string;
      date: string;
    }> = [];

    const communiques = await this.communiqueService.findAll();
    for (const c of communiques) {
      items.push({
        id: `communique-${c.id}`,
        kind: 'announcement',
        source: 'communique',
        title: c.title ?? '',
        message: c.content ?? '',
        attachmentUrl: c.attachmentUrl ?? '',
        ctaLabel: '',
        ctaHref: '',
        tag: 'Annonces',
        href: '',
        date:
          c.createdAt instanceof Date
            ? c.createdAt.toISOString()
            : String(c.createdAt ?? ''),
      });
    }

    const flagged = await this.contentRepo
      .createQueryBuilder('c')
      .select(['c.id', 'c.fieldValues', 'c.updatedAt', 'c.linkedEntityType'])
      .where('c.status = :st', { st: ContentStatus.PUBLISHED })
      .andWhere('c.visibility = :vi', { vi: ContentVisibility.PUBLIC })
      .andWhere(
        `LOWER(c."fieldValues"->>'notify') IN ('true','1','yes','oui')`,
      )
      .andWhere('c.linkedEntityType IN (:...lt)', {
        lt: ['Teaching', 'Event', 'CommunityUpdate'],
      })
      .getMany();

    for (const row of flagged) {
      const fv = row.fieldValues ?? {};
      const kind =
        row.linkedEntityType === 'Teaching'
          ? ('teaching' as const)
          : row.linkedEntityType === 'Event'
            ? ('event' as const)
            : ('community' as const);
      const slug = this.stringField(fv['slug']);
      const baseTitle =
        this.stringField(fv['title']) || this.stringField(fv['name']);
      const title =
        this.stringField(fv['notificationTitle']) || baseTitle;
      const message =
        this.stringField(fv['notificationMessage']) ||
        this.stringField(fv['summary']) ||
        this.stringField(fv['description']);
      const ctaLabel = this.stringField(fv['notificationCtaLabel']);
      const notificationHref = this.stringField(fv['notificationCtaHref']);
      const tag =
        this.stringField(fv['notificationTag']) ||
        this.defaultNotificationTag(kind);
      const contentHref =
        kind === 'teaching'
          ? slug
            ? `/enseignements/${slug}`
            : ''
          : kind === 'event'
            ? slug
              ? `/evenements/${slug}`
              : ''
            : this.stringField(fv['href']);
      const href = notificationHref || contentHref;

      items.push({
        id: `content-${row.id}`,
        kind,
        source: 'content',
        title,
        message,
        attachmentUrl: '',
        ctaLabel,
        ctaHref: href,
        tag,
        href,
        date:
          row.updatedAt instanceof Date
            ? row.updatedAt.toISOString()
            : String(row.updatedAt ?? ''),
      });
    }

    const seen = new Set<string>();
    let merged = items.filter((item) => {
      if (!item.title || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    merged.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const tagFilter = q.tag?.trim().toLowerCase();
    if (tagFilter) {
      merged = merged.filter((item) => item.tag.toLowerCase() === tagFilter);
    }

    return {
      items: merged.slice(0, limit),
      total: merged.length,
      page: 1,
      limit,
    };
  }
}
