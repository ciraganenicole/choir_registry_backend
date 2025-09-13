import { UserCategory } from '../../users/enums/user-category.enum';

export interface SongUser {
  id: number;
  type: 'admin' | 'user';
  categories?: UserCategory[];
  firstName?: string;
  lastName?: string;
  username?: string;
  email: string;
}

export interface SongPermission {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
  canManageOthers: boolean;
} 