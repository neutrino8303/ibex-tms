import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";

type ConditionalLinkRow = {
  qualificationId: string;
  conditionalQualificationId: string;
};

function hasQualificationConditionalModel(): boolean {
  return typeof (prisma as { qualificationConditional?: { findMany: unknown } })
    .qualificationConditional?.findMany === "function";
}

function appendLink(
  map: Map<string, string[]>,
  qualificationId: string,
  conditionalQualificationId: string,
): void {
  const existing = map.get(qualificationId) ?? [];
  if (!existing.includes(conditionalQualificationId)) {
    existing.push(conditionalQualificationId);
    map.set(qualificationId, existing);
  }
}

async function loadLinksFromJoinTable(
  qualificationIds?: string[],
): Promise<ConditionalLinkRow[]> {
  if (hasQualificationConditionalModel()) {
    return prisma.qualificationConditional.findMany({
      where:
        qualificationIds && qualificationIds.length > 0
          ? { qualificationId: { in: qualificationIds } }
          : undefined,
      select: {
        qualificationId: true,
        conditionalQualificationId: true,
      },
    });
  }

  try {
    if (qualificationIds && qualificationIds.length > 0) {
      return prisma.$queryRaw<ConditionalLinkRow[]>`
        SELECT "qualificationId", "conditionalQualificationId"
        FROM "QualificationConditional"
        WHERE "qualificationId" IN (${Prisma.join(qualificationIds)})
      `;
    }

    return prisma.$queryRaw<ConditionalLinkRow[]>`
      SELECT "qualificationId", "conditionalQualificationId"
      FROM "QualificationConditional"
    `;
  } catch {
    return [];
  }
}

async function loadLinksFromLegacyColumn(
  qualificationIds?: string[],
): Promise<ConditionalLinkRow[]> {
  try {
    if (qualificationIds && qualificationIds.length > 0) {
      return prisma.$queryRaw<ConditionalLinkRow[]>`
        SELECT
          id AS "qualificationId",
          "conditionalQualificationId"
        FROM "Qualification"
        WHERE "conditionalQualificationId" IS NOT NULL
          AND id IN (${Prisma.join(qualificationIds)})
      `;
    }

    return prisma.$queryRaw<ConditionalLinkRow[]>`
      SELECT
        id AS "qualificationId",
        "conditionalQualificationId"
      FROM "Qualification"
      WHERE "conditionalQualificationId" IS NOT NULL
    `;
  } catch {
    return [];
  }
}

/** Conditional qualification IDs per catalog qualification. */
export async function fetchConditionalIdsByQualificationId(
  qualificationIds?: string[],
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();

  const joinLinks = await loadLinksFromJoinTable(qualificationIds);
  for (const link of joinLinks) {
    appendLink(map, link.qualificationId, link.conditionalQualificationId);
  }
  if (joinLinks.length > 0 || hasQualificationConditionalModel()) {
    return map;
  }

  const legacyLinks = await loadLinksFromLegacyColumn(qualificationIds);
  for (const link of legacyLinks) {
    appendLink(map, link.qualificationId, link.conditionalQualificationId);
  }

  return map;
}

export async function fetchQualificationIdsDependingOn(
  conditionalQualificationId: string,
): Promise<string[]> {
  if (hasQualificationConditionalModel()) {
    const links = await prisma.qualificationConditional.findMany({
      where: { conditionalQualificationId },
      select: { qualificationId: true },
    });
    return links.map((link) => link.qualificationId);
  }

  try {
    const rows = await prisma.$queryRaw<{ qualificationId: string }[]>`
      SELECT "qualificationId"
      FROM "QualificationConditional"
      WHERE "conditionalQualificationId" = ${conditionalQualificationId}
    `;
    return rows.map((row) => row.qualificationId);
  } catch {
    try {
      const rows = await prisma.$queryRaw<{ qualificationId: string }[]>`
        SELECT id AS "qualificationId"
        FROM "Qualification"
        WHERE "conditionalQualificationId" = ${conditionalQualificationId}
      `;
      return rows.map((row) => row.qualificationId);
    } catch {
      return [];
    }
  }
}
