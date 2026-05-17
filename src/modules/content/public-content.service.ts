import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Content } from './content.entity';
import { ContentType } from './content-type.entity';
import { Song } from '../song/song.entity';
import { ContentStatus } from './enums/content-status.enum';
import { ContentVisibility } from './enums/content-visibility.enum';
import { PublicContentListQueryDto } from './dto/public-content-query.dto';

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
      bodyParagraphs: fv['bodyParagraphs'] ?? [],
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
      subDepartmentSlugs: fv['subDepartmentSlugs'] ?? [],
      eventSlugs: fv['eventSlugs'] ?? [],
    };
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
    return {
      ...base,
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
      seoDefaults: fv['seoDefaults'] ?? {},
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
    return {
      headline: fv['headline'],
      bodyHtml: fv['bodyHtml'],
      methods: fv['methods'] ?? [],
      legalNoticeHtml: fv['legalNoticeHtml'],
      receiptContact: fv['receiptContact'],
    };
  }
}
