import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getCurrentUser, hasAnyRole, type CurrentUser } from "@/lib/auth";

const ADMIN_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.TRAINING_MANAGER];

export async function requireAdminUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasAnyRole(user, ADMIN_ROLES)) {
    redirect("/");
  }
  return user;
}

export async function requireAdminActorId(): Promise<string> {
  const user = await requireAdminUser();
  return user.id;
}
