import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './push-subscription.entity';
import { ProgramReminder } from './program-reminder.entity';
import {
  ProgramReminderDto,
  PushSubscriptionDto,
} from './dto/push.dto';
import { CHURCH_TIMEZONE, churchDateTimeToEpoch } from './schedule.util';

const REMINDER_LEAD_MS = 30 * 60_000;

/** Content types whose publication should notify all subscribed users. */
const BROADCAST_LINKED_TYPES = new Set([
  'Teaching',
  'Event',
  'CommunityUpdate',
  'Programme',
  'LiveEvent',
]);

function pickString(
  source: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function contentPublicUrl(
  linkedType: string,
  fieldValues: Record<string, unknown>,
): string {
  const slug = pickString(fieldValues, ['slug']);
  switch (linkedType) {
    case 'Teaching':
      return slug ? `/enseignements/${slug}` : '/#enseignements';
    case 'Event':
      return slug ? `/evenements/${slug}` : '/#vie-eglise';
    case 'Programme':
      return '/#aujourdhui';
    case 'LiveEvent':
      return '/live';
    case 'CommunityUpdate':
      return '/#communaute';
    default:
      return '/';
  }
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;
  private readonly publicKey: string | null;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptions: Repository<PushSubscription>,
    @InjectRepository(ProgramReminder)
    private readonly reminders: Repository<ProgramReminder>,
  ) {
    this.publicKey = process.env.VAPID_PUBLIC_KEY?.trim() || null;
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() || '';
    const subject =
      process.env.VAPID_SUBJECT?.trim() || 'mailto:contact@celpasalem.org';
    this.enabled =
      Boolean(this.publicKey) &&
      Boolean(privateKey) &&
      process.env.PUSH_ENABLED !== 'false';

    if (this.enabled) {
      webpush.setVapidDetails(subject, this.publicKey as string, privateKey);
    } else {
      this.logger.warn(
        'Web push disabled: set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to enable.',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getPublicKey(): string | null {
    return this.publicKey;
  }

  async saveSubscription(
    dto: PushSubscriptionDto,
    userAgent?: string,
  ): Promise<{ id: number }> {
    let row = await this.subscriptions.findOne({
      where: { endpoint: dto.endpoint },
    });
    if (!row) {
      row = this.subscriptions.create({ endpoint: dto.endpoint });
    }
    row.p256dh = dto.keys.p256dh;
    row.auth = dto.keys.auth;
    row.deviceId = dto.deviceId?.trim() || row.deviceId || null;
    row.fullName = dto.fullName?.trim() || row.fullName || null;
    row.contact = dto.contact?.trim() || row.contact || null;
    row.userAgent = userAgent?.slice(0, 300) || row.userAgent || null;
    const saved = await this.subscriptions.save(row);
    return { id: saved.id };
  }

  async createReminder(dto: ProgramReminderDto): Promise<{ id: number }> {
    const clientId = dto.clientId?.trim() || null;
    const deviceId = dto.deviceId?.trim() || null;

    let row =
      clientId && deviceId
        ? await this.reminders.findOne({
            where: { clientId, deviceId },
          })
        : null;
    if (!row) {
      row = this.reminders.create();
    }

    row.clientId = clientId;
    row.deviceId = deviceId;
    row.title = dto.title.trim();
    row.programmeTitle = dto.programmeTitle?.trim() || null;
    row.occurrenceDate = dto.occurrenceDate;
    row.time = dto.time.trim();
    row.note = dto.note?.trim() || null;
    row.sourceRef = dto.sourceRef?.trim() || null;
    row.fullName = dto.fullName?.trim() || null;
    row.contact = dto.contact?.trim() || null;
    row.notifiedAt = null;
    const saved = await this.reminders.save(row);
    return { id: saved.id };
  }

  async deleteReminder(params: {
    clientId?: string;
    deviceId?: string;
  }): Promise<{ deleted: number }> {
    const where: { clientId?: string; deviceId?: string } = {};
    if (params.clientId?.trim()) where.clientId = params.clientId.trim();
    if (params.deviceId?.trim()) where.deviceId = params.deviceId.trim();
    if (Object.keys(where).length === 0) return { deleted: 0 };
    const res = await this.reminders.delete(where);
    return { deleted: res.affected ?? 0 };
  }

  @Cron('* * * * *', { timeZone: CHURCH_TIMEZONE })
  async sendDueReminders(): Promise<void> {
    if (!this.enabled) return;

    let pending: ProgramReminder[];
    try {
      pending = await this.reminders.find({ where: { notifiedAt: IsNull() } });
    } catch (error) {
      this.logger.error(
        `Failed to load reminders: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return;
    }

    const now = Date.now();
    for (const reminder of pending) {
      const start = churchDateTimeToEpoch(
        reminder.occurrenceDate,
        reminder.time,
      );
      if (start === null) continue;
      const remindAt = start - REMINDER_LEAD_MS;
      if (now < remindAt || now >= start) continue;

      reminder.notifiedAt = new Date();
      await this.reminders.save(reminder);
      await this.deliver(reminder);
    }
  }

  private async deliver(reminder: ProgramReminder): Promise<void> {
    const subs = reminder.deviceId
      ? await this.subscriptions.find({
          where: { deviceId: reminder.deviceId },
        })
      : [];
    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title: `Rappel · ${reminder.title}`,
      body:
        reminder.note?.trim() ||
        'Ça commence dans 30 minutes. À bientôt !',
      tag: `program-${reminder.clientId ?? reminder.id}`,
      url: '/#aujourdhui',
    });

    await this.sendToSubscriptions(subs, payload);
  }

  /** Send one payload to all active (and matching) subscriptions. */
  private async sendToSubscriptions(
    subs: PushSubscription[],
    payload: string,
  ): Promise<number> {
    let delivered = 0;
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
            { TTL: 3600 },
          );
          delivered += 1;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await this.subscriptions.delete({ id: sub.id });
            this.logger.log(`Removed expired push subscription ${sub.id}`);
          } else {
            this.logger.warn(
              `Push failed (${status ?? 'unknown'}): ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }
      }),
    );
    return delivered;
  }

  /** Broadcast a notification to every active subscriber. */
  async broadcast(payload: {
    title: string;
    body: string;
    url?: string;
    tag?: string;
  }): Promise<number> {
    if (!this.enabled) return 0;
    const subs = await this.subscriptions.find();
    if (subs.length === 0) return 0;

    const message = JSON.stringify({
      title: payload.title,
      body: payload.body,
      tag: payload.tag,
      url: payload.url ?? '/',
    });
    const delivered = await this.sendToSubscriptions(subs, message);
    this.logger.log(
      `Broadcast push "${payload.title}" → ${delivered}/${subs.length}`,
    );
    return delivered;
  }

  /** Broadcast a freshly published CMS entry when it is notification-worthy. */
  async broadcastContent(content: {
    id: number;
    linkedEntityType: string;
    fieldValues: Record<string, unknown> | null;
  }): Promise<number> {
    if (!BROADCAST_LINKED_TYPES.has(content.linkedEntityType)) return 0;
    const fieldValues = content.fieldValues ?? {};
    const title =
      pickString(fieldValues, ['notificationTitle', 'title', 'name']) ||
      'Nouveau contenu';
    const body = stripHtml(
      pickString(fieldValues, [
        'notificationMessage',
        'summary',
        'description',
        'subtitle',
      ]),
    ).slice(0, 300);
    const url = contentPublicUrl(content.linkedEntityType, fieldValues);
    return this.broadcast({
      title,
      body,
      url,
      tag: `content-${content.id}`,
    });
  }
}
