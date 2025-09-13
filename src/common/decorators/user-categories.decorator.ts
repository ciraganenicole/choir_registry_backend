import { SetMetadata } from '@nestjs/common';
import { UserCategory } from '../../modules/users/enums/user-category.enum';

export const UserCategories = (...categories: UserCategory[]) => SetMetadata('userCategories', categories); 