// src/lib/roleHelper.ts
import { UserRole as DbUserRole } from '../../../candidate/src/types';

export type JwtRole = 'candidate' | 'recruiter' | 'admin';

export function mapDbRoleToJwtRole(role: DbUserRole): JwtRole {
  switch (role) {
    case DbUserRole.CANDIDATE:
      return 'candidate';
    case DbUserRole.RECRUITER:
      return 'recruiter';
    case DbUserRole.ADMIN:
      return 'admin';
    default: {
      const _exhaustiveCheck: never = role;
      throw new Error(`Unsupported role: ${_exhaustiveCheck}`);
    }
  }
}
