import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleAssignment } from './user-role-assignment.entity';

export type EffectivePermissions = {
  global: Set<string>;
  /** departmentId -> permission codes from roles scoped to that department */
  byDepartment: Map<number, Set<string>>;
};

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(UserRoleAssignment)
    private readonly assignmentRepo: Repository<UserRoleAssignment>,
  ) {}

  /**
   * Loads permission codes from all role assignments (global + per-department).
   */
  async getEffectivePermissions(userId: number): Promise<EffectivePermissions> {
    const rows = await this.assignmentRepo
      .createQueryBuilder('ura')
      .innerJoin('ura.user', 'u')
      .innerJoin('ura.role', 'role')
      .innerJoin('role.permissions', 'perm')
      .where('u.id = :userId', { userId })
      .select([
        'perm.code AS code',
        'ura.departmentId AS "departmentId"',
      ])
      .getRawMany<{ code: string; departmentId: number | null }>();

    const global = new Set<string>();
    const byDepartment = new Map<number, Set<string>>();

    for (const row of rows) {
      if (row.departmentId == null) {
        global.add(row.code);
      } else {
        let set = byDepartment.get(row.departmentId);
        if (!set) {
          set = new Set();
          byDepartment.set(row.departmentId, set);
        }
        set.add(row.code);
      }
    }

    return { global, byDepartment };
  }

  /** All codes the user holds anywhere (union of global + every department bucket). */
  async getAllPermissionCodesFlat(userId: number): Promise<Set<string>> {
    const { global, byDepartment } = await this.getEffectivePermissions(userId);
    const out = new Set(global);
    for (const set of byDepartment.values()) {
      for (const c of set) out.add(c);
    }
    return out;
  }

  /**
   * Permissions that apply for a given audience department (null = org-wide only global assignments).
   */
  codesForAudience(
    effective: EffectivePermissions,
    audienceDepartmentId: number | null,
  ): Set<string> {
    const codes = new Set(effective.global);
    if (audienceDepartmentId != null) {
      const dept = effective.byDepartment.get(audienceDepartmentId);
      if (dept) {
        for (const c of dept) codes.add(c);
      }
    }
    return codes;
  }

  hasAnyCode(codes: Set<string>, required: readonly string[]): boolean {
    return required.some((r) => codes.has(r));
  }
}
