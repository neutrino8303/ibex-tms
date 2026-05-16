import { UserRole } from "@prisma/client";
import type { CurrentUser } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth";

const MANAGE_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
];

export function canManageUserQualifications(user: CurrentUser): boolean {
  return hasAnyRole(user, MANAGE_ROLES);
}
