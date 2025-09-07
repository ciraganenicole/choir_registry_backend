import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../../modules/admin/admin-role.enum';
import { UserCategory } from '../../modules/users/enums/user-category.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Super admin has access to everything
    if (user.role === AdminRole.SUPER_ADMIN) {
      return true;
    }

    // Check if user has the required role (admin roles)
    if (requiredRoles.includes(user.role)) {
      return true;
    }

    // Check if user has the required category (for UserCategory values)
    if (user.categories && Array.isArray(user.categories)) {
      return requiredRoles.some((role) => user.categories.includes(role));
    }

    return false;
  }
} 