import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole } from '../../modules/admin/admin-role.enum';
import {
  PERMISSIONS_KEY,
} from '../decorators/require-permissions.decorator';
import { RbacService } from '../../modules/users/rbac.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Missing user');
    }

    if (
      user.type === 'admin' &&
      [AdminRole.SUPER_ADMIN, AdminRole.FINANCE_ADMIN, AdminRole.ATTENDANCE_ADMIN].includes(
        user.role as AdminRole,
      )
    ) {
      return true;
    }

    const userId = user.id;
    if (userId == null || typeof userId !== 'number') {
      throw new ForbiddenException('Invalid user for permission check');
    }

    const codes = await this.rbacService.getAllPermissionCodesFlat(userId);
    const ok = required.some((r) => codes.has(r));
    if (!ok) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
