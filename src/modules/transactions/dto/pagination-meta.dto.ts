import { differenceInCalendarDays } from 'date-fns';

/**
 * Standard pagination metadata for list endpoints (DB still uses LIMIT/OFFSET; we do not load full tables in memory).
 */
export class PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  /** True when results were capped (e.g. export mode max rows). */
  truncated?: boolean;
}

export type PaginationInput = {
  page?: number;
  limit?: number;
  exportAll?: boolean;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
/** Server-side ceiling for `limit` on ledger-style endpoints. */
export const MAX_PAGE_SIZE = 100;
/** When exportAll=true, cap rows to protect the database and Node heap. */
export const MAX_EXPORT_ROWS = 25_000;

function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function nextGregorianLeapYearOnOrAfter(year: number): number {
  for (let y = year; y < year + 8; y++) {
    if (isGregorianLeapYear(y)) {
      return y;
    }
  }
  return year + 4;
}

/**
 * Longest inclusive Jan 1 → Dec 31 span in days (occurs in a leap year). Derived from calendar math.
 */
export const MAX_DAILY_DATE_RANGE_DAYS = (() => {
  const y = nextGregorianLeapYearOnOrAfter(new Date().getUTCFullYear());
  const jan1Utc = new Date(Date.UTC(y, 0, 1));
  const dec31Utc = new Date(Date.UTC(y, 11, 31));
  return differenceInCalendarDays(dec31Utc, jan1Utc) + 1;
})();

export function resolvePagination(input: PaginationInput): {
  page: number;
  limit: number;
  offset: number;
  mode: 'paged' | 'export';
  take: number | undefined;
} {
  const page = Math.max(1, Math.floor(Number(input.page ?? DEFAULT_PAGE)) || DEFAULT_PAGE);
  let limit = Math.floor(Number(input.limit ?? DEFAULT_LIMIT)) || DEFAULT_LIMIT;
  if (limit < 1) {
    limit = DEFAULT_LIMIT;
  }
  if (!input.exportAll && limit > MAX_PAGE_SIZE) {
    limit = MAX_PAGE_SIZE;
  }

  if (input.exportAll) {
    return {
      page: 1,
      limit: MAX_EXPORT_ROWS,
      offset: 0,
      mode: 'export',
      take: MAX_EXPORT_ROWS,
    };
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
    mode: 'paged',
    take: limit,
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
  options?: { truncated?: boolean },
): PaginationMetaDto {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && page < totalPages,
    hasPreviousPage: page > 1,
    ...(options?.truncated != null ? { truncated: options.truncated } : {}),
  };
}
