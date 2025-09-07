import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../../modules/admin/admin-role.enum';
import { UserCategory } from '../../modules/users/enums/user-category.enum';

export const Roles = (...roles: (AdminRole | UserCategory | string)[]) => SetMetadata('roles', roles); 