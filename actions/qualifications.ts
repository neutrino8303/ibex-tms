"use server";

import { revalidatePath } from "next/cache";
import { QualCategory } from "@prisma/client";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { writeAuditLog } from "@/server/audit";
import { prisma } from "@/server/db";
import { requireAdminActorId } from "@/server/require-admin";

const categoryEnum = z.nativeEnum(QualCategory);

const qualificationSchema = z.object({
  code: z
    .string()
    .min(2, "Code is required")
    .max(32)
    .regex(/^[A-Z0-9-]+$/, "Use uppercase letters, numbers, and hyphens"),
  name: z.string().min(2, "Name is required"),
  category: categoryEnum,
  validityPeriodDays: z.coerce
    .number()
    .int()
    .min(1, "Validity must be at least 1 day")
    .max(3650, "Validity cannot exceed 10 years"),
  description: z.string().optional(),
});

const createQualificationSchema = qualificationSchema;

const updateQualificationSchema = qualificationSchema.extend({
  qualificationId: z.string().min(1),
});

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const text = value?.toString().trim();
  return text ? text : undefined;
}

export async function createQualificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actorId = await requireAdminActorId();

  const parsed = createQualificationSchema.safeParse({
    code: formData.get("code")?.toString().toUpperCase(),
    name: formData.get("name"),
    category: formData.get("category"),
    validityPeriodDays: formData.get("validityPeriodDays"),
    description: emptyToUndefined(formData.get("description")),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.qualification.findUnique({
    where: { code: parsed.data.code },
  });
  if (existing) {
    return { error: "A qualification with this code already exists" };
  }

  const qualification = await prisma.qualification.create({
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      category: parsed.data.category,
      validityPeriodDays: parsed.data.validityPeriodDays,
      description: parsed.data.description ?? null,
    },
  });

  await writeAuditLog({
    actorId,
    action: "QUALIFICATION_CREATED",
    entityType: "Qualification",
    entityId: qualification.id,
    afterValue: qualification,
  });

  revalidatePath("/admin/qualifications");
  return { success: true };
}

export async function updateQualificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actorId = await requireAdminActorId();

  const parsed = updateQualificationSchema.safeParse({
    qualificationId: formData.get("qualificationId"),
    code: formData.get("code")?.toString().toUpperCase(),
    name: formData.get("name"),
    category: formData.get("category"),
    validityPeriodDays: formData.get("validityPeriodDays"),
    description: emptyToUndefined(formData.get("description")),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.qualification.findUnique({
    where: { id: parsed.data.qualificationId },
  });

  if (!existing) {
    return { error: "Qualification not found" };
  }

  const codeTaken = await prisma.qualification.findFirst({
    where: {
      code: parsed.data.code,
      NOT: { id: parsed.data.qualificationId },
    },
  });
  if (codeTaken) {
    return { error: "A qualification with this code already exists" };
  }

  const qualification = await prisma.qualification.update({
    where: { id: parsed.data.qualificationId },
    data: {
      code: parsed.data.code,
      name: parsed.data.name,
      category: parsed.data.category,
      validityPeriodDays: parsed.data.validityPeriodDays,
      description: parsed.data.description ?? null,
    },
  });

  await writeAuditLog({
    actorId,
    action: "QUALIFICATION_UPDATED",
    entityType: "Qualification",
    entityId: qualification.id,
    beforeValue: existing,
    afterValue: qualification,
  });

  revalidatePath("/admin/qualifications");
  revalidatePath("/dashboard/expiring");
  return { success: true };
}
