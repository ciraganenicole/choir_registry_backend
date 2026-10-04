/** Church local timezone (Goma / East DRC). */
export const CHURCH_TIMEZONE = 'Africa/Lubumbashi';

/** 0 = Dimanche … 6 = Samedi (aligné sur Date.getDay() / church TZ). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ParticipationStep = {
  title: string;
  description: string;
};

export type RecurringProgram = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  meta: string;
  description: string;
  daysOfWeek: Weekday[];
  isActive: boolean;
  steps: ParticipationStep[];
  actionLabel: string;
};

export type ScheduleOverride = {
  id: string;
  date: string; // YYYY-MM-DD
  kind: 'add' | 'hide';
  programId: string;
  title: string;
  subtitle: string;
  time: string;
  meta: string;
  description: string;
  steps: ParticipationStep[];
  actionLabel: string;
};

export type ResolvedScheduleItem = {
  id: string;
  source: 'recurring' | 'override' | 'programme';
  programId: string | null;
  meta: string;
  title: string;
  subtitle: string;
  time: string;
  action: string;
  description: string;
  steps: ParticipationStep[];
  /** Calendar date of this occurrence (YYYY-MM-DD). */
  occurrenceDate: string;
  weekday: Weekday;
  weekdayLabel: string;
  programTitle: string;
};

export type NextGathering = {
  date: string;
  weekday: Weekday;
  weekdayLabel: string;
  time: string;
  /** e.g. "Dimanche, 08h00" */
  headline: string;
  title: string;
  subtitle: string;
  meta: string;
};

export type ResolvedSchedule = {
  date: string;
  weekday: number;
  weekdayLabel: string;
  items: ResolvedScheduleItem[];
  nextGathering: NextGathering | null;
};

export const WEEKDAY_LABELS_FR = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
] as const;

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asSteps(raw: unknown): ParticipationStep[] {
  if (!Array.isArray(raw)) return [];
  const out: ParticipationStep[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const title = asString(o.title);
    const description = asString(o.description);
    if (!title) continue;
    out.push({ title, description });
  }
  return out;
}

function asDaysOfWeek(raw: unknown): Weekday[] {
  if (!Array.isArray(raw)) return [];
  const out: Weekday[] = [];
  for (const d of raw) {
    const n = typeof d === 'number' ? d : Number(d);
    if (!Number.isInteger(n) || n < 0 || n > 6) continue;
    if (!out.includes(n as Weekday)) out.push(n as Weekday);
  }
  return out.sort((a, b) => a - b);
}

export function normalizeRecurringPrograms(raw: unknown): RecurringProgram[] {
  if (!Array.isArray(raw)) return [];
  const out: RecurringProgram[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const id = asString(o.id);
    const title = asString(o.title);
    const time = asString(o.time);
    const daysOfWeek = asDaysOfWeek(o.daysOfWeek);
    if (!id || !title || !time || daysOfWeek.length === 0) continue;
    out.push({
      id,
      title,
      subtitle: asString(o.subtitle),
      time,
      meta: asString(o.meta) || 'PROGRAMME',
      description: asString(o.description),
      daysOfWeek,
      isActive: o.isActive !== false,
      steps: asSteps(o.steps),
      actionLabel: asString(o.actionLabel) || 'Détails',
    });
  }
  return out;
}

export function normalizeScheduleOverrides(raw: unknown): ScheduleOverride[] {
  if (!Array.isArray(raw)) return [];
  const out: ScheduleOverride[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const id = asString(o.id);
    const date = asString(o.date);
    const kind = o.kind === 'hide' ? 'hide' : o.kind === 'add' ? 'add' : null;
    if (!id || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !kind) continue;
    out.push({
      id,
      date,
      kind,
      programId: asString(o.programId),
      title: asString(o.title),
      subtitle: asString(o.subtitle),
      time: asString(o.time),
      meta: asString(o.meta) || 'PROGRAMME',
      description: asString(o.description),
      steps: asSteps(o.steps),
      actionLabel: asString(o.actionLabel) || 'Détails',
    });
  }
  return out;
}

/** Today's calendar date in church TZ as YYYY-MM-DD. */
export function todayInKinshasa(now = new Date()): string {
  return todayInChurchTz(now);
}

export function todayInChurchTz(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CHURCH_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function nowMinutesInChurchTz(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CHURCH_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  // en-GB can yield "24" for midnight in some engines
  const h = hour === 24 ? 0 : hour;
  return h * 60 + minute;
}

export function weekdayInKinshasa(dateYmd: string): Weekday {
  return weekdayInChurchTz(dateYmd);
}

export function weekdayInChurchTz(dateYmd: string): Weekday {
  // Noon UTC avoids edge cases; Lubumbashi is UTC+2 year-round.
  const [y, m, d] = dateYmd.split('-').map((x) => Number(x));
  const utc = new Date(Date.UTC(y, m - 1, d, 11, 0, 0));
  const wd = new Intl.DateTimeFormat('en-US', {
    timeZone: CHURCH_TIMEZONE,
    weekday: 'short',
  }).format(utc);
  const map: Record<string, Weekday> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

export function addDaysYmd(dateYmd: string, days: number): string {
  const [y, m, d] = dateYmd.split('-').map((x) => Number(x));
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  const yyyy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(utc.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Monday (YYYY-MM-DD) of the church-TZ week containing `dateYmd`. */
export function mondayOf(dateYmd: string): string {
  const wd = weekdayInChurchTz(dateYmd); // 0 = Sunday … 6 = Saturday
  const offset = (wd + 6) % 7;
  return addDaysYmd(dateYmd, -offset);
}

/** Normalize "09h00", "9h", "9:00" to the canonical "HH:mm" form. */
export function normalizeTimeString(value: string): string {
  const match = value.match(/^\s*(\d{1,2})\s*[h:]\s*(\d{2})?\s*$/i);
  if (!match) return value.trim();
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour > 23 || minute > 59) return value.trim();
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function timeSortKey(time: string): number {
  const m = time.match(/(\d{1,2})\s*[h:]\s*(\d{2})?/i);
  if (!m) return 9999;
  return Number(m[1]) * 60 + Number(m[2] ?? 0);
}

/**
 * Absolute epoch (ms) of a church-local date + time.
 * Africa/Lubumbashi is UTC+2 year-round.
 */
export function churchDateTimeToEpoch(
  dateYmd: string,
  time: string,
): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd);
  if (!m) return null;
  const minutes = timeSortKey(time);
  if (minutes >= 9999) return null;
  return (
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) +
    (minutes - 120) * 60_000
  );
}

function capitalizeFr(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function displayTitle(programTitle: string, time: string, weekday: Weekday): string {
  const dayLabel = capitalizeFr(WEEKDAY_LABELS_FR[weekday]);
  if (programTitle.includes('·') || programTitle.includes(time)) {
    return programTitle;
  }
  return `${dayLabel} · ${time}`;
}

function toResolvedItem(
  base: {
    id: string;
    source: 'recurring' | 'override';
    programId: string | null;
    meta: string;
    programTitle: string;
    subtitle: string;
    time: string;
    action: string;
    description: string;
    steps: ParticipationStep[];
  },
  dateYmd: string,
  weekday: Weekday,
): ResolvedScheduleItem {
  return {
    id: base.id,
    source: base.source,
    programId: base.programId,
    meta: base.meta,
    title: displayTitle(base.programTitle, base.time, weekday),
    subtitle: base.subtitle || base.programTitle,
    time: base.time,
    action: base.action,
    description: base.description,
    steps: base.steps,
    occurrenceDate: dateYmd,
    weekday,
    weekdayLabel: WEEKDAY_LABELS_FR[weekday],
    programTitle: base.programTitle,
  };
}

/** Resolve programs that fall on a single calendar date. */
export function resolveScheduleForDate(
  dateYmd: string,
  recurringRaw: unknown,
  overridesRaw: unknown,
): ResolvedSchedule {
  const weekday = weekdayInChurchTz(dateYmd);
  const recurring = normalizeRecurringPrograms(recurringRaw);
  const overrides = normalizeScheduleOverrides(overridesRaw).filter(
    (o) => o.date === dateYmd,
  );

  const hiddenIds = new Set(
    overrides.filter((o) => o.kind === 'hide' && o.programId).map((o) => o.programId),
  );

  const items: ResolvedScheduleItem[] = [];

  for (const p of recurring) {
    if (!p.isActive) continue;
    if (!p.daysOfWeek.includes(weekday)) continue;
    if (hiddenIds.has(p.id)) continue;
    items.push(
      toResolvedItem(
        {
          id: p.id,
          source: 'recurring',
          programId: p.id,
          meta: p.meta,
          programTitle: p.title,
          subtitle: p.subtitle,
          time: p.time,
          action: p.actionLabel,
          description: p.description,
          steps: p.steps,
        },
        dateYmd,
        weekday,
      ),
    );
  }

  for (const o of overrides) {
    if (o.kind !== 'add') continue;
    if (!o.title || !o.time) continue;
    items.push(
      toResolvedItem(
        {
          id: o.id,
          source: 'override',
          programId: null,
          meta: o.meta,
          programTitle: o.title,
          subtitle: o.subtitle,
          time: o.time,
          action: o.actionLabel,
          description: o.description,
          steps: o.steps,
        },
        dateYmd,
        weekday,
      ),
    );
  }

  items.sort((a, b) => timeSortKey(a.time) - timeSortKey(b.time));

  const next = items[0]
    ? {
        date: items[0].occurrenceDate,
        weekday: items[0].weekday,
        weekdayLabel: items[0].weekdayLabel,
        time: items[0].time,
        headline: `${capitalizeFr(items[0].weekdayLabel)}, ${items[0].time}`,
        title: items[0].programTitle,
        subtitle: items[0].subtitle,
        meta: items[0].meta,
      }
    : null;

  return {
    date: dateYmd,
    weekday,
    weekdayLabel: WEEKDAY_LABELS_FR[weekday],
    items,
    nextGathering: next,
  };
}

/**
 * Next upcoming program occurrences from a starting date/time (church TZ).
 * Walks forward day by day; includes later days when today is sparse.
 * `limit` caps the landing grid (default 4). First item = prochain rassemblement.
 */
export function resolveUpcomingSchedule(
  fromYmd: string,
  recurringRaw: unknown,
  overridesRaw: unknown,
  opts: { limit?: number; fromTimeMinutes?: number | null } = {},
): ResolvedSchedule {
  const limit = Math.max(1, Math.min(opts.limit ?? 4, 20));
  const fromTimeMinutes =
    typeof opts.fromTimeMinutes === 'number' ? opts.fromTimeMinutes : null;
  const startWeekday = weekdayInChurchTz(fromYmd);
  const collected: ResolvedScheduleItem[] = [];

  for (let offset = 0; offset < 14 && collected.length < limit; offset++) {
    const dateYmd = addDaysYmd(fromYmd, offset);
    const day = resolveScheduleForDate(dateYmd, recurringRaw, overridesRaw);
    let dayItems = day.items;
    if (offset === 0 && fromTimeMinutes !== null) {
      dayItems = dayItems.filter((item) => timeSortKey(item.time) >= fromTimeMinutes);
    }
    for (const item of dayItems) {
      if (collected.length >= limit) break;
      // Stable unique key per occurrence (same recurring id can appear once per week)
      const key = `${item.occurrenceDate}:${item.id}`;
      if (collected.some((c) => `${c.occurrenceDate}:${c.id}` === key)) continue;
      collected.push(item);
    }
  }

  const nextGathering: NextGathering | null = collected[0]
    ? {
        date: collected[0].occurrenceDate,
        weekday: collected[0].weekday,
        weekdayLabel: collected[0].weekdayLabel,
        time: collected[0].time,
        headline: `${capitalizeFr(collected[0].weekdayLabel)}, ${collected[0].time}`,
        title: collected[0].programTitle,
        subtitle: collected[0].subtitle,
        meta: collected[0].meta,
      }
    : null;

  return {
    date: fromYmd,
    weekday: startWeekday,
    weekdayLabel: WEEKDAY_LABELS_FR[startWeekday],
    items: collected,
    nextGathering,
  };
}
