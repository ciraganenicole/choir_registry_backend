export enum ContentFieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  HTML = 'html',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  IMAGE = 'image',
  IMAGES = 'images',
  RELATION = 'relation',
  /** FK to a row in a linked-entity table (songs, departments, albums, …) */
  ENTITY_RELATION = 'entity_relation',
  /** Array of { name, roleTitle, imageUrl? } — e.g. department responsables */
  PROFILE_LIST = 'profile_list',
  /** Array of department videos (YouTube, URL, or upload) */
  VIDEO_LIST = 'video_list',
  /** Array of { label, url } — site social links */
  SOCIAL_LINK_LIST = 'social_link_list',
  /** Object { title, description, ogImage } — homepage SEO */
  SEO_DEFAULTS = 'seo_defaults',
  /** Array of { timeRange, title, description? } — event programme */
  PROGRAM_LIST = 'program_list',
  /** Array of { day, time, title, description } — weekly church schedule */
  WEEKLY_PROGRAM_LIST = 'weekly_program_list',
  /**
   * Array of recurring programs for “Aujourd’hui à Salem”:
   * { id, title, subtitle?, time, meta?, description?, daysOfWeek[], isActive, steps? }
   */
  RECURRING_PROGRAM_LIST = 'recurring_program_list',
  /**
   * Date exceptions: hide a recurring program or add a one-off on a date
   * { id, date, kind: 'add'|'hide', programId?, title?, … }
   */
  SCHEDULE_OVERRIDE_LIST = 'schedule_override_list',
  /** Array of { name, roleTitle, bio?, imageUrl? } — event moderators */
  MODERATOR_LIST = 'moderator_list',
  /** Array of strings — e.g. event body paragraphs */
  STRING_LIST = 'string_list',
  /** Object { text, reference } — scripture quote */
  SCRIPTURE = 'scripture',
  /**
   * Teaching faith journey steps:
   * { key, label, statement, guidance, actionLabel, hasNote?, notePlaceholder? }
   */
  TEACHING_JOURNEY_LIST = 'teaching_journey_list',
  /**
   * Homepage “La vie à Salem” gallery tiles:
   * { imageUrl, caption?, alt?, large? }
   */
  GALLERY_ITEM_LIST = 'gallery_item_list',
  /**
   * “How to participate” steps for dated programmes:
   * { title, description? }
   */
  PARTICIPATION_LIST = 'participation_list',
}
