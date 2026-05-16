import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser, hasAnyRole, type CurrentUser } from "@/lib/auth";

const STAFF_VIEW_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.EXAMINER,
  UserRole.INSTRUCTOR,
  UserRole.AUDITOR,
];

export async function requirePilotProfileAccess(
  pilotId: string,
): Promise<CurrentUser> {
  const viewer = await getCurrentUser();
  if (!viewer) {
    redirect("/login");
  }
  if (viewer.id === pilotId) {
    return viewer;
  }
  if (!hasAnyRole(viewer, STAFF_VIEW_ROLES)) {
    redirect("/");
  }
  return viewer;
}
