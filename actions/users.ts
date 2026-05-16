"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { hashPassword } from "@/lib/auth";
import { writeAuditLog } from "@/server/audit";
import { prisma } from "@/server/db";
import { requireAdminActorId } from "@/server/require-admin";

const roleEnum = z.nativeEnum(UserRole);

const userFieldsSchema = z.object({
  email: z.string().email("Enter a valid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  employeeNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  base: z.string().optional(),
});

const createUserSchema = userFieldsSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  roles: z.array(roleEnum).min(1, "Select at least one role"),
});

const updateUserSchema = userFieldsSchema.extend({
  userId: z.string().min(1),
  password: z
    .string()
    .optional()
    .refine((value) => !value || value.length >= 8, {
      message: "Password must be at least 8 characters",
    }),
  roles: z.array(roleEnum).min(1, "Select at least one role"),
});

function parseRoles(formData: FormData): UserRole[] {
  return formData
    .getAll("roles")
    .map((value) => String(value))
    .filter((value): value is UserRole =>
      Object.values(UserRole).includes(value as UserRole),
    );
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const text = value?.toString().trim();
  return text ? text : undefined;
}

export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actorId = await requireAdminActorId();

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    employeeNumber: emptyToUndefined(formData.get("employeeNumber")),
    licenseNumber: emptyToUndefined(formData.get("licenseNumber")),
    base: emptyToUndefined(formData.get("base")),
    roles: parseRoles(formData),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "A user with this email already exists" };
  }

  if (parsed.data.employeeNumber) {
    const existingEmployee = await prisma.user.findUnique({
      where: { employeeNumber: parsed.data.employeeNumber },
    });
    if (existingEmployee) {
      return { error: "Employee number is already in use" };
    }
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      employeeNumber: parsed.data.employeeNumber ?? null,
      licenseNumber: parsed.data.licenseNumber ?? null,
      base: parsed.data.base ?? null,
      roles: {
        create: parsed.data.roles.map((role) => ({ role })),
      },
    },
    include: { roles: true },
  });

  await writeAuditLog({
    actorId,
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    afterValue: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map((r) => r.role),
    },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actorId = await requireAdminActorId();

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    email: formData.get("email"),
    password: emptyToUndefined(formData.get("password")),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    employeeNumber: emptyToUndefined(formData.get("employeeNumber")),
    licenseNumber: emptyToUndefined(formData.get("licenseNumber")),
    base: emptyToUndefined(formData.get("base")),
    roles: parseRoles(formData),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: { roles: true },
  });

  if (!existing) {
    return { error: "User not found" };
  }

  const email = parsed.data.email.toLowerCase();
  const emailTaken = await prisma.user.findFirst({
    where: { email, NOT: { id: parsed.data.userId } },
  });
  if (emailTaken) {
    return { error: "A user with this email already exists" };
  }

  if (parsed.data.employeeNumber) {
    const employeeTaken = await prisma.user.findFirst({
      where: {
        employeeNumber: parsed.data.employeeNumber,
        NOT: { id: parsed.data.userId },
      },
    });
    if (employeeTaken) {
      return { error: "Employee number is already in use" };
    }
  }

  const beforeValue = {
    email: existing.email,
    firstName: existing.firstName,
    lastName: existing.lastName,
    employeeNumber: existing.employeeNumber,
    licenseNumber: existing.licenseNumber,
    base: existing.base,
    roles: existing.roles.map((r) => r.role),
  };

  const passwordHash = parsed.data.password
    ? await hashPassword(parsed.data.password)
    : undefined;

  const user = await prisma.$transaction(async (tx) => {
    await tx.userRoleAssignment.deleteMany({
      where: { userId: parsed.data.userId },
    });

    return tx.user.update({
      where: { id: parsed.data.userId },
      data: {
        email,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        employeeNumber: parsed.data.employeeNumber ?? null,
        licenseNumber: parsed.data.licenseNumber ?? null,
        base: parsed.data.base ?? null,
        ...(passwordHash ? { passwordHash } : {}),
        roles: {
          create: parsed.data.roles.map((role) => ({ role })),
        },
      },
      include: { roles: true },
    });
  });

  await writeAuditLog({
    actorId,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: user.id,
    beforeValue,
    afterValue: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      employeeNumber: user.employeeNumber,
      licenseNumber: user.licenseNumber,
      base: user.base,
      roles: user.roles.map((r) => r.role),
    },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/pilots/${user.id}`);
  return { success: true };
}
