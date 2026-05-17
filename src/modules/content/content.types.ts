import { AdminRole } from '../admin/admin-role.enum';

/** Shape of `req.user` from JwtStrategy for content APIs */
export type ContentJwtUser = {
  id: number;
  type?: string;
  role?: string;
  email?: string;
  adminId?: number;
  username?: string;
};

const ADMIN_CMS_ROLES: readonly string[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FINANCE_ADMIN,
  AdminRole.ATTENDANCE_ADMIN,
];

export function isAdminCmsUser(user: ContentJwtUser): boolean {
  return user.type === 'admin' && !!user.role && ADMIN_CMS_ROLES.includes(user.role);
}
