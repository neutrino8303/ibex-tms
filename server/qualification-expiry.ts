import { startOfDay } from "date-fns";
import { prisma } from "@/server/db";
import {
  fetchConditionalIdsByQualificationId,
  fetchQualificationIdsDependingOn,
} from "@/server/qualification-conditionals";

export type EffectiveExpiry = {
  expiryDate: Date;
  limitedByQualificationId: string | null;
};

function sameCalendarDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

/** Effective expiry is the earliest of original and each conditional qualification's effective expiry. */
export function computeEffectiveExpiry(
  originalExpiryDate: Date,
  conditionalQualificationIds: string[],
  effectiveExpiryByQualificationId: Map<string, Date>,
): EffectiveExpiry {
  let expiryDate = originalExpiryDate;
  let limitedByQualificationId: string | null = null;

  for (const conditionalId of conditionalQualificationIds) {
    const conditionalExpiry = effectiveExpiryByQualificationId.get(conditionalId);
    if (
      conditionalExpiry &&
      startOfDay(conditionalExpiry) < startOfDay(expiryDate)
    ) {
      expiryDate = conditionalExpiry;
      limitedByQualificationId = conditionalId;
    }
  }

  return { expiryDate, limitedByQualificationId };
}

function reachesQualification(
  fromQualificationId: string,
  targetQualificationId: string,
  conditionalIdsByQualificationId: Map<string, string[]>,
): boolean {
  const stack = [fromQualificationId];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === targetQualificationId) {
      return true;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const dependencies = conditionalIdsByQualificationId.get(current) ?? [];
    for (const dependencyId of dependencies) {
      stack.push(dependencyId);
    }
  }

  return false;
}

export async function wouldCreateConditionalCycles(
  qualificationId: string,
  conditionalQualificationIds: string[],
): Promise<boolean> {
  const uniqueIds = [...new Set(conditionalQualificationIds)];
  if (uniqueIds.includes(qualificationId)) {
    return true;
  }

  const conditionalIdsByQualificationId =
    await fetchConditionalIdsByQualificationId();

  for (const conditionalId of uniqueIds) {
    if (
      reachesQualification(
        conditionalId,
        qualificationId,
        conditionalIdsByQualificationId,
      )
    ) {
      return true;
    }
  }

  return false;
}

/** Recompute effective expiry for all of a pilot's qualifications (handles dependency chains). */
export async function recomputeAllEffectiveExpiriesForUser(
  userId: string,
): Promise<void> {
  const records = await prisma.userQualification.findMany({
    where: { userId },
  });

  if (records.length === 0) {
    return;
  }

  const qualificationIds = records.map((record) => record.qualificationId);
  const conditionalIdsByQualificationId =
    await fetchConditionalIdsByQualificationId(qualificationIds);

  const effectiveByQualificationId = new Map<string, Date>(
    records.map((record) => [
      record.qualificationId,
      record.originalExpiryDate,
    ]),
  );

  const maxPasses = records.length + 1;
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    const nextEffective = new Map(effectiveByQualificationId);

    for (const record of records) {
      const conditionalIds =
        conditionalIdsByQualificationId.get(record.qualificationId) ?? [];
      const computed = computeEffectiveExpiry(
        record.originalExpiryDate,
        conditionalIds,
        effectiveByQualificationId,
      );
      const previous = effectiveByQualificationId.get(record.qualificationId)!;
      if (!sameCalendarDay(computed.expiryDate, previous)) {
        nextEffective.set(record.qualificationId, computed.expiryDate);
        changed = true;
      }
    }

    if (!changed) {
      break;
    }

    for (const [qualificationId, expiryDate] of nextEffective) {
      effectiveByQualificationId.set(qualificationId, expiryDate);
    }
  }

  await Promise.all(
    records.map((record) => {
      const conditionalIds =
        conditionalIdsByQualificationId.get(record.qualificationId) ?? [];
      const computed = computeEffectiveExpiry(
        record.originalExpiryDate,
        conditionalIds,
        effectiveByQualificationId,
      );

      const expiryChanged = !sameCalendarDay(
        record.expiryDate,
        computed.expiryDate,
      );
      const limitedByChanged =
        record.limitedByQualificationId !== computed.limitedByQualificationId;

      if (!expiryChanged && !limitedByChanged) {
        return Promise.resolve();
      }

      return prisma.userQualification.update({
        where: { id: record.id },
        data: {
          expiryDate: computed.expiryDate,
          limitedByQualificationId: computed.limitedByQualificationId,
        },
      });
    }),
  );
}

/** Recompute pilots holding this qualification or any qualification that depends on it. */
export async function recomputeUsersAffectedByCatalogQualification(
  qualificationId: string,
): Promise<void> {
  const dependentQualificationIds =
    await fetchQualificationIdsDependingOn(qualificationId);

  const qualificationIds = [
    qualificationId,
    ...dependentQualificationIds,
  ];

  const users = await prisma.userQualification.findMany({
    where: { qualificationId: { in: qualificationIds } },
    select: { userId: true },
    distinct: ["userId"],
  });

  for (const { userId } of users) {
    await recomputeAllEffectiveExpiriesForUser(userId);
  }
}

function hasQualificationConditionalModel(): boolean {
  return typeof (prisma as { qualificationConditional?: { findMany: unknown } })
    .qualificationConditional?.findMany === "function";
}

export async function syncQualificationConditionals(
  qualificationId: string,
  conditionalQualificationIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(conditionalQualificationIds)];

  if (hasQualificationConditionalModel()) {
    await prisma.qualificationConditional.deleteMany({
      where: { qualificationId },
    });

    if (uniqueIds.length > 0) {
      await prisma.qualificationConditional.createMany({
        data: uniqueIds.map((conditionalQualificationId) => ({
          qualificationId,
          conditionalQualificationId,
        })),
        skipDuplicates: true,
      });
    }
    return;
  }

  await prisma.$executeRaw`
    DELETE FROM "QualificationConditional"
    WHERE "qualificationId" = ${qualificationId}
  `;

  for (const conditionalQualificationId of uniqueIds) {
    await prisma.$executeRaw`
      INSERT INTO "QualificationConditional" ("id", "qualificationId", "conditionalQualificationId")
      VALUES (${`qc_${qualificationId}_${conditionalQualificationId}`}, ${qualificationId}, ${conditionalQualificationId})
      ON CONFLICT ("qualificationId", "conditionalQualificationId") DO NOTHING
    `;
  }
}
