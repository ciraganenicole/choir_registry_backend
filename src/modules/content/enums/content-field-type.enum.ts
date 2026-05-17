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
}
