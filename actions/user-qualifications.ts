"use server";

import { revalidatePath } from "next/cache";
import { addDays, startOfDay } from "date-fns";
import { QualStatus } from "@prisma/client";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { deriveQualificationLifecycleDates } from "@/lib/user-qualification-dates";
import {
  computeStatus,
  daysUntilExpiry,
} from "@/lib/qualifications";
import { toUserQualificationAuditSnapshot } from "@/lib/user-qualification-audit";
import { writeAuditLog } from "@/server/audit";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/lib/auth";
import { requireAdminActorId } from "@/server/require-admin";
import { requirePilotProfileAccess } from "@/server/require-pilot-view";
import { fetchConditionalIdsByQualificationId } from "@/server/qualification-conditionals";
import { recomputeAllEffectiveExpiriesForUser } from "@/server/qualification-expiry";
import { canViewUserQualificationHistory } from "@/server/user-qualifications";
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

export type QualificationConditionalRefDto = {
  id: string;
  code: string;
  name: string;
};

export type UserQualificationDetailDto = {
  id: string;
  code: string;
  name: string;
  validityPeriodDays: number;
  issuingAuthority: string | null;
  storedStatus: string;
  displayStatus: string;
  daysRemaining: number;
  issuedDate: string;
  originalExpiryDate: string;
  expiryDate: string;
  expiryReducedByName: string | null;
  initialAcquisitionDate: string;
  lastRenewalDate: string | null;
  conditionals: QualificationConditionalRefDto[];
  history: UserQualificationHistoryDto[];
};

export async function fetchUserQualificationDetailAction(
  userQualificationId: string,
): Promise<UserQualificationDetailDto | null> {
  const record = await prisma.userQualification.findUnique({
    where: { id: userQualificationId },
    include: {
      qualification: true,
      limitedByQualification: { select: { name: true } },
    },
  });

  if (!record) {
    return null;
  }

  const viewer = await getCurrentUser();
  if (!viewer) {
    return null;
  }

  await requirePilotProfileAccess(record.userId);

  const now = new Date();
  const displayStatus = computeStatus(record.expiryDate, {
    storedStatus: record.status,
    now,
  });

  const historyEntries = await getUserQualificationHistory(userQualificationId);
  const { initialAcquisitionDate, lastRenewalDate } =
    deriveQualificationLifecycleDates(historyEntries, record.issuedDate);

  const conditionalIds = await fetchConditionalIdsByQualificationId([
    record.qualificationId,
  ]);
  const conditionalIdList =
    conditionalIds.get(record.qualificationId) ?? [];

  const conditionalCatalog =
    conditionalIdList.length > 0
      ? await prisma.qualification.findMany({
          where: { id: { in: conditionalIdList } },
          select: { id: true, code: true, name: true },
          orderBy: { code: "asc" },
        })
      : [];

  const history: UserQualificationHistoryDto[] = historyEntries.map((entry) => ({
    ...entry,
    timestamp: entry.timestamp.toISOString(),
  }));

  return {
    id: record.id,
    code: record.qualification.code,
    name: record.qualification.name,
    validityPeriodDays: record.qualification.validityPeriodDays,
    issuingAuthority: record.issuingAuthority,
    storedStatus: record.status,
    displayStatus,
    daysRemaining: daysUntilExpiry(record.expiryDate, now),
    issuedDate: record.issuedDate.toISOString(),
    originalExpiryDate: record.originalExpiryDate.toISOString(),
    expiryDate: record.expiryDate.toISOString(),
    expiryReducedByName: record.limitedByQualification?.name ?? null,
    initialAcquisitionDate: initialAcquisitionDate.toISOString(),
    lastRenewalDate: lastRenewalDate?.toISOString() ?? null,
    conditionals: conditionalCatalog,
    history,
  };
}

export async function fetchUserQualificationHistoryAction(
  userQualificationId: string,
): Promise<UserQualificationHistoryDto[]> {
  const record = await loadUserQualificationRecord(userQualificationId);
  if (!record) {
    return [];
  }

  const viewer = await getCurrentUser();
  if (!viewer) {
    return [];
  }

  await requirePilotProfileAccess(record.userId);

  if (!canViewUserQualificationHistory(viewer)) {
    return [];
  }

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
      originalExpiryDate: dates.expiryDate,
      expiryDate: dates.expiryDate,
      issuingAuthority: parsed.data.issuingAuthority ?? "EASA",
      status: parsed.data.status,
    },
    include: { qualification: true },
  });

  await recomputeAllEffectiveExpiriesForUser(parsed.data.userId);

  const refreshed = await loadUserQualificationRecord(record.id);

  await writeAuditLog({
    actorId,
    action: "USER_QUALIFICATION_CREATED",
    entityType: "UserQualification",
    entityId: record.id,
    afterValue: toUserQualificationAuditSnapshot(refreshed ?? record),
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
  await prisma.userQualification.update({
    where: { id: parsed.data.userQualificationId },
    data: {
      issuedDate: dates.issuedDate,
      originalExpiryDate: dates.expiryDate,
      expiryDate: dates.expiryDate,
      limitedByQualificationId: null,
      issuingAuthority: parsed.data.issuingAuthority ?? null,
      status: parsed.data.status,
    },
  });

  await recomputeAllEffectiveExpiriesForUser(parsed.data.userId);

  const record = await loadUserQualificationRecord(parsed.data.userQualificationId);

  if (!record) {
    return { error: "Qualification record not found" };
  }

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

    const originalExpiryDate = addDays(
      issuedDate,
      existing.qualification.validityPeriodDays,
    );

    await prisma.userQualification.update({
      where: { id: existing.id },
      data: {
        issuedDate,
        originalExpiryDate,
        expiryDate: originalExpiryDate,
        limitedByQualificationId: null,
        status: QualStatus.VALID,
        linkedEvaluationId: null,
      },
    });

    await recomputeAllEffectiveExpiriesForUser(parsed.data.userId);

    const record = await loadUserQualificationRecord(existing.id);

    if (!record) {
      return { error: "Qualification record not found" };
    }

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
      message: `${record.qualification.code} renewed until ${record.expiryDate.toLocaleDateString("en-GB")}`,
    };
  } catch (error) {
    console.error("renewUserQualificationAction failed:", error);
    return {
      error:
        "Renewal failed. If this keeps happening, restart the dev server with pnpm dev:clean.",
    };
  }
}
