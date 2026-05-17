import { UserRole } from "@prisma/client";
import type { CurrentUser } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth";

const MANAGE_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
];

const HISTORY_ROLES: UserRole[] = [
  ...MANAGE_ROLES,
  UserRole.AUDITOR,
];

export function canManageUserQualifications(user: CurrentUser): boolean {
  return hasAnyRole(user, MANAGE_ROLES);
}

/** Change history is staff-only; pilots may view their records but not audit trails. */
export function canViewUserQualificationHistory(user: CurrentUser): boolean {
  return hasAnyRole(user, HISTORY_ROLES);
}
