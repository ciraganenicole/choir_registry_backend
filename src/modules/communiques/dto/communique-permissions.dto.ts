import { UserCategory } from '../../users/enums/user-category.enum';

export interface CommuniqueUser {
  id: number;
  type: 'admin' | 'user';
  role?: string;
  categories?: UserCategory[];
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
}

export interface CommuniquePermission {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  canManageOthers: boolean;
}
