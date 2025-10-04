import { UserCategory } from '../../users/enums/user-category.enum';

export interface ReportUser {
  id: number;
  type: 'admin' | 'user';
  role?: string;
  categories?: UserCategory[];
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
}

export interface ReportPermission {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  canManageOthers: boolean;
}
