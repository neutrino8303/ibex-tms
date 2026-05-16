import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import { prisma } from "@/server/db";
import { getSession } from "@/server/session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type CurrentUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { roles: true },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    roles: user.roles.map((r) => r.role),
  };
}

export function hasAnyRole(user: CurrentUser, roles: UserRole[]): boolean {
  return roles.some((role) => user.roles.includes(role));
}

export function hasRole(user: CurrentUser, role: UserRole): boolean {
  return user.roles.includes(role);
}
