"use server";

import { revalidatePath } from "next/cache";
import { addDays, startOfDay } from "date-fns";
import { QualStatus } from "@prisma/client";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { toUserQualificationAuditSnapshot } from "@/lib/user-qualification-audit";
import { writeAuditLog } from "@/server/audit";
import { prisma } from "@/server/db";
import { requireAdminActorId } from "@/server/require-admin";
import { requirePilotProfileAccess } from "@/server/require-pilot-view";
import {
  getUserQualificationHistory,
  type UserQualificationHistoryEntry,
} from "@/server/user-qualification-audit";

const qualStatusEnum = z.nativeEnum(QualStatus);

const userQualificationFieldsSchema = z
  .object({
    userId: z.string().min(1),
    qualificationId: z.string().min(1),
    issuedDate: z.string().min(1, "Issued date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    issuingAuthority: z.string().optional(),
    status: qualStatusEnum.default(QualStatus.VALID),
  })
  .superRefine((data, ctx) => {
    const issued = new Date(data.issuedDate);
    const expiry = new Date(data.expiryDate);
    if (Number.isNaN(issued.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid issued date",
        path: ["issuedDate"],
      });
    }
    if (Number.isNaN(expiry.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid expiry date",
        path: ["expiryDate"],
      });
    }
    if (
      !Number.isNaN(issued.getTime()) &&
      !Number.isNaN(expiry.getTime()) &&
      expiry < issued
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry must be on or after issued date",
        path: ["expiryDate"],
      });
    }
  });

const createUserQualificationSchema = userQualificationFieldsSchema;

const updateUserQualificationSchema = z
  .object({
    userQualificationId: z.string().min(1),
    userId: z.string().min(1),
    issuedDate: z.string().min(1, "Issued date is required"),
    expiryDate: z.string().min(1, "Expiry date is required"),
    issuingAuthority: z.string().optional(),
    status: qualStatusEnum,
  })
  .superRefine((data, ctx) => {
    const issued = new Date(data.issuedDate);
    const expiry = new Date(data.expiryDate);
    if (Number.isNaN(issued.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid issued date",
        path: ["issuedDate"],
      });
    }
    if (Number.isNaN(expiry.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid expiry date",
        path: ["expiryDate"],
      });
    }
    if (
      !Number.isNaN(issued.getTime()) &&
      !Number.isNaN(expiry.getTime()) &&
      expiry < issued
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expiry must be on or after issued date",
        path: ["expiryDate"],
      });
    }
  });

const renewUserQualificationSchema = z.object({
  userQualificationId: z.string().min(1),
  userId: z.string().min(1),
  issuedDate: z.string().optional(),
  notes: z.string().optional(),
});

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  const text = value?.toString().trim();
  return text ? text : undefined;
}

function parseDates(issuedDate: string, expiryDate: string) {
  return {
    issuedDate: new Date(issuedDate),
    expiryDate: new Date(expiryDate),
  };
}

async function loadUserQualificationRecord(id: string) {
  return prisma.userQualification.findUnique({
    where: { id },
    include: { qualification: true },
  });
}

export type UserQualificationHistoryDto = Omit<
  UserQualificationHistoryEntry,
  "timestamp"
> & {
  timestamp: string;
};

export async function fetchUserQualificationHistoryAction(
  userQualificationId: string,
): Promise<UserQualificationHistoryDto[]> {
  const record = await loadUserQualificationRecord(userQualificationId);
  if (!record) {
    return [];
  }

  await requirePilotProfileAccess(record.userId);

  const history = await getUserQualificationHistory(userQualificationId);
  return history.map((entry) => ({
    ...entry,
    timestamp: entry.timestamp.toISOString(),
  }));
}

export async function createUserQualificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actorId = await requireAdminActorId();

  const parsed = createUserQualificationSchema.safeParse({
    userId: formData.get("userId"),
    qualificationId: formData.get("qualificationId"),
    issuedDate: formData.get("issuedDate"),
    expiryDate: formData.get("expiryDate"),
    issuingAuthority: emptyToUndefined(formData.get("issuingAuthority")),
    status: formData.get("status") ?? QualStatus.VALID,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const pilot = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true },
  });
  if (!pilot) {
    return { error: "Pilot not found" };
  }

  const qualification = await prisma.qualification.findUnique({
    where: { id: parsed.data.qualificationId },
  });
  if (!qualification) {
    return { error: "Qualification not found" };
  }

  const duplicate = await prisma.userQualification.findFirst({
    where: {
      userId: parsed.data.userId,
      qualificationId: parsed.data.qualificationId,
    },
  });
  if (duplicate) {
    return {
      error:
        "This pilot already has that qualification. Edit the existing record instead.",
    };
  }

  const dates = parseDates(parsed.data.issuedDate, parsed.data.expiryDate);
  const record = await prisma.userQualification.create({
    data: {
      userId: parsed.data.userId,
      qualificationId: parsed.data.qualificationId,
      issuedDate: dates.issuedDate,
      expiryDate: dates.expiryDate,
      issuingAuthority: parsed.data.issuingAuthority ?? "EASA",
      status: parsed.data.status,
    },
    include: { qualification: true },
  });

  await writeAuditLog({
    actorId,
    action: "USER_QUALIFICATION_CREATED",
    entityType: "UserQualification",
    entityId: record.id,
    afterValue: toUserQualificationAuditSnapshot(record),
  });

  revalidatePath(`/pilots/${parsed.data.userId}`);
  revalidatePath("/dashboard/expiring");
  return { success: true, message: "Qualification added" };
}

export async function updateUserQualificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actorId = await requireAdminActorId();

  const parsed = updateUserQualificationSchema.safeParse({
    userQualificationId: formData.get("userQualificationId"),
    userId: formData.get("userId"),
    issuedDate: formData.get("issuedDate"),
    expiryDate: formData.get("expiryDate"),
    issuingAuthority: emptyToUndefined(formData.get("issuingAuthority")),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await loadUserQualificationRecord(parsed.data.userQualificationId);

  if (!existing || existing.userId !== parsed.data.userId) {
    return { error: "Qualification record not found" };
  }

  const dates = parseDates(parsed.data.issuedDate, parsed.data.expiryDate);
  const record = await prisma.userQualification.update({
    where: { id: parsed.data.userQualificationId },
    data: {
      issuedDate: dates.issuedDate,
      expiryDate: dates.expiryDate,
      issuingAuthority: parsed.data.issuingAuthority ?? null,
      status: parsed.data.status,
    },
    include: { qualification: true },
  });

  await writeAuditLog({
    actorId,
    action: "USER_QUALIFICATION_UPDATED",
    entityType: "UserQualification",
    entityId: record.id,
    beforeValue: toUserQualificationAuditSnapshot(existing),
    afterValue: toUserQualificationAuditSnapshot(record),
  });

  revalidatePath(`/pilots/${parsed.data.userId}`);
  revalidatePath("/dashboard/expiring");
  return { success: true, message: "Qualification updated" };
}

export async function renewUserQualificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actorId = await requireAdminActorId();

  try {
    const parsed = renewUserQualificationSchema.safeParse({
      userQualificationId: formData.get("userQualificationId"),
      userId: formData.get("userId"),
      issuedDate: emptyToUndefined(formData.get("issuedDate")),
      notes: emptyToUndefined(formData.get("notes")),
    });

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const existing = await loadUserQualificationRecord(
      parsed.data.userQualificationId,
    );

    if (!existing || existing.userId !== parsed.data.userId) {
      return { error: "Qualification record not found" };
    }

    const issuedDate = parsed.data.issuedDate
      ? startOfDay(new Date(parsed.data.issuedDate))
      : startOfDay(new Date());

    if (Number.isNaN(issuedDate.getTime())) {
      return { error: "Invalid issued date" };
    }

    const expiryDate = addDays(
      issuedDate,
      existing.qualification.validityPeriodDays,
    );

    const record = await prisma.userQualification.update({
      where: { id: existing.id },
      data: {
        issuedDate,
        expiryDate,
        status: QualStatus.VALID,
        linkedEvaluationId: null,
      },
      include: { qualification: true },
    });

    await writeAuditLog({
      actorId,
      action: "USER_QUALIFICATION_RENEWED",
      entityType: "UserQualification",
      entityId: record.id,
      beforeValue: toUserQualificationAuditSnapshot(existing),
      afterValue: toUserQualificationAuditSnapshot({
        ...record,
        notes: parsed.data.notes,
      }),
    });

    revalidatePath(`/pilots/${parsed.data.userId}`);
    revalidatePath("/dashboard/expiring");
    return {
      success: true,
      message: `${record.qualification.code} renewed until ${expiryDate.toLocaleDateString("en-GB")}`,
    };
  } catch (error) {
    console.error("renewUserQualificationAction failed:", error);
    return {
      error:
        "Renewal failed. If this keeps happening, restart the dev server with pnpm dev:clean.",
    };
  }
}
