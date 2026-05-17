/**
 * Discriminator values for `Content.linkedEntityType` (polymorphic link).
 * Add new types here and validate target rows in ContentService when needed.
 */
export const LINKED_ENTITY_TYPES = [
  'Performance',
  'Communique',
  'User',
  'Department',
  'Rehearsal',
  'Song',
  'Report',
  'Event',
  'DepartmentPage',
  'SiteProfile',
  'DonationSettings',
  'Album',
  'Playlist',
] as const;

export type LinkedEntityType = (typeof LINKED_ENTITY_TYPES)[number];

export function isLinkedEntityType(v: string): v is LinkedEntityType {
  return (LINKED_ENTITY_TYPES as readonly string[]).includes(v);
}
