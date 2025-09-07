import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserCategory } from '../../modules/users/enums/user-category.enum';

@Injectable()
export class UserCategoriesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredCategories = this.reflector.getAllAndOverride<UserCategory[]>('userCategories', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredCategories) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // Check if user has any of the required categories
    if (user.categories && Array.isArray(user.categories)) {
      return requiredCategories.some((category) => user.categories.includes(category));
    }
    
    return false;
  }
} 