/** Derive a URL slug from a human-readable title or name. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const SLUG_SOURCE_FIELD_BY_TYPE_CODE: Record<string, string> = {
  ChurchEvent: 'title',
  DepartmentPage: 'name',
  Album: 'title',
};
