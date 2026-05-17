/** Stable permission codes stored in `permissions.code` */
export const PERMISSION_CODES = {
  GLOBAL_VIEWER: 'global.viewer',
  GLOBAL_EDITOR: 'global.editor',
  GLOBAL_PUBLISHER: 'global.publisher',
  CONTENT_DEPARTMENT_EDIT: 'content.department.edit',
  CONTENT_DEPARTMENT_APPROVE: 'content.department.approve',
  CONTENT_SCHEMA_MANAGE: 'content.schema.manage',
} as const;

export const CONTENT_MODULE_ACCESS_CODES = [
  PERMISSION_CODES.GLOBAL_VIEWER,
  PERMISSION_CODES.GLOBAL_EDITOR,
  PERMISSION_CODES.GLOBAL_PUBLISHER,
  PERMISSION_CODES.CONTENT_DEPARTMENT_EDIT,
] as const;

export const CONTENT_UPLOAD_CODES = [
  PERMISSION_CODES.GLOBAL_EDITOR,
  PERMISSION_CODES.GLOBAL_PUBLISHER,
  PERMISSION_CODES.CONTENT_DEPARTMENT_EDIT,
] as const;
