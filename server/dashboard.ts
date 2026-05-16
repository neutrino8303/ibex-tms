import {
  EvaluationStatus,
  QualCategory,
  QualStatus,
  UserRole,
} from "@prisma/client";
import type { CurrentUser } from "@/lib/auth";
import { hasAnyRole, hasRole } from "@/lib/auth";
import {
  computeStatus,
  daysUntilExpiry,
} from "@/lib/qualifications";
import { evaluationListWhere } from "@/server/evaluations";
import { prisma } from "@/server/db";

const ORG_DASHBOARD_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.AUDITOR,
];

const EVALUATOR_ROLES: UserRole[] = [UserRole.EXAMINER, UserRole.INSTRUCTOR];

const OPEN_EVAL_STATUSES: EvaluationStatus[] = [
  EvaluationStatus.ASSIGNED,
  EvaluationStatus.IN_PROGRESS,
];

export function canViewOrgDashboard(user: CurrentUser): boolean {
  return hasAnyRole(user, ORG_DASHBOARD_ROLES);
}

export type EnrichedQualificationRow = {
  id: string;
  userId: string;
  pilotName: string;
  pilotBase: string | null;
  employeeNumber: string | null;
  qualificationCode: string;
  qualificationName: string;
  category: QualCategory;
  expiryDate: Date;
  issuedDate: Date;
  issuingAuthority: string | null;
  status: QualStatus;
  daysRemaining: number;
};

export type DashboardStats = {
  scope: "organization" | "personal";
  pilots: number | null;
  qualificationsExpiringSoon: number;
  qualificationsExpired: number;
  qualificationsSuspended: number;
  openEvaluations: number;
  completedEvaluations: number;
};

export type ExpiringQualFilters = {
  status?: "all" | "expiring" | "expired" | "suspended";
  category?: QualCategory | "all";
  base?: string | "all";
  q?: string;
};

async function loadQualificationRecords(userIds?: string[]) {
  return prisma.userQualification.findMany({
    where: userIds ? { userId: { in: userIds } } : undefined,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          base: true,
          employeeNumber: true,
        },
      },
      qualification: {
        select: {
          code: true,
          name: true,
          category: true,
        },
      },
    },
    orderBy: { expiryDate: "asc" },
  });
}

function enrichRecords(
  records: Awaited<ReturnType<typeof loadQualificationRecords>>,
  now = new Date(),
): EnrichedQualificationRow[] {
  return records.map((record) => {
    const status = computeStatus(record.expiryDate, {
      storedStatus: record.status,
      now,
    });
    return {
      id: record.id,
      userId: record.userId,
      pilotName: `${record.user.firstName} ${record.user.lastName}`,
      pilotBase: record.user.base,
      employeeNumber: record.user.employeeNumber,
      qualificationCode: record.qualification.code,
      qualificationName: record.qualification.name,
      category: record.qualification.category,
      expiryDate: record.expiryDate,
      issuedDate: record.issuedDate,
      issuingAuthority: record.issuingAuthority,
      status,
      daysRemaining: daysUntilExpiry(record.expiryDate, now),
    };
  });
}

export async function getDashboardStats(
  user: CurrentUser,
): Promise<DashboardStats> {
  const now = new Date();
  const orgView = canViewOrgDashboard(user);

  const qualUserIds = orgView
    ? undefined
    : [user.id];

  const records = enrichRecords(
    await loadQualificationRecords(qualUserIds),
    now,
  );

  let openEvaluations = 0;
  let completedEvaluations = 0;
  let pilots: number | null = null;

  if (orgView) {
    pilots = await prisma.user.count({
      where: { roles: { some: { role: UserRole.PILOT } } },
    });
    openEvaluations = await prisma.evaluation.count({
      where: { status: { in: OPEN_EVAL_STATUSES } },
    });
    completedEvaluations = await prisma.evaluation.count({
      where: { status: EvaluationStatus.COMPLETED },
    });
  } else {
    const evalWhere = evaluationListWhere(user);
    if (evalWhere !== null) {
      openEvaluations = await prisma.evaluation.count({
        where: {
          ...evalWhere,
          status: { in: OPEN_EVAL_STATUSES },
        },
      });
      completedEvaluations = await prisma.evaluation.count({
        where: {
          ...evalWhere,
          status: EvaluationStatus.COMPLETED,
        },
      });
    }
  }

  return {
    scope: orgView ? "organization" : "personal",
    pilots,
    qualificationsExpiringSoon: records.filter(
      (row) => row.status === QualStatus.EXPIRING_SOON,
    ).length,
    qualificationsExpired: records.filter(
      (row) => row.status === QualStatus.EXPIRED,
    ).length,
    qualificationsSuspended: records.filter(
      (row) => row.status === QualStatus.SUSPENDED,
    ).length,
    openEvaluations,
    completedEvaluations,
  };
}

export async function listExpiringQualifications(
  user: CurrentUser,
  filters: ExpiringQualFilters,
): Promise<{
  rows: EnrichedQualificationRow[];
  bases: string[];
  total: number;
}> {
  if (!canViewOrgDashboard(user)) {
    return { rows: [], bases: [], total: 0 };
  }

  const now = new Date();
  const enriched = enrichRecords(await loadQualificationRecords(), now);

  const bases = [
    ...new Set(
      enriched
        .map((row) => row.pilotBase)
        .filter((base): base is string => Boolean(base)),
    ),
  ].sort();

  const statusFilter = filters.status ?? "all";
  const categoryFilter = filters.category ?? "all";
  const baseFilter = filters.base ?? "all";
  const query = filters.q?.trim().toLowerCase() ?? "";

  const rows = enriched.filter((row) => {
    if (statusFilter === "expiring" && row.status !== QualStatus.EXPIRING_SOON) {
      return false;
    }
    if (statusFilter === "expired" && row.status !== QualStatus.EXPIRED) {
      return false;
    }
    if (statusFilter === "suspended" && row.status !== QualStatus.SUSPENDED) {
      return false;
    }
    if (
      statusFilter === "all" &&
      row.status !== QualStatus.EXPIRING_SOON &&
      row.status !== QualStatus.EXPIRED &&
      row.status !== QualStatus.SUSPENDED
    ) {
      return false;
    }

    if (categoryFilter !== "all" && row.category !== categoryFilter) {
      return false;
    }

    if (baseFilter !== "all" && row.pilotBase !== baseFilter) {
      return false;
    }

    if (query) {
      const haystack = [
        row.pilotName,
        row.employeeNumber ?? "",
        row.qualificationCode,
        row.qualificationName,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });

  return { rows, bases, total: rows.length };
}

export async function getDashboardQualPreview(
  user: CurrentUser,
  limit = 5,
): Promise<EnrichedQualificationRow[]> {
  const now = new Date();
  const records = enrichRecords(
    await loadQualificationRecords(
      canViewOrgDashboard(user) ? undefined : [user.id],
    ),
    now,
  );

  return records
    .filter(
      (row) =>
        row.status === QualStatus.EXPIRING_SOON ||
        row.status === QualStatus.EXPIRED,
    )
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, limit);
}

export function showEvaluatorWorkload(user: CurrentUser): boolean {
  return (
    hasAnyRole(user, EVALUATOR_ROLES) &&
    !canViewOrgDashboard(user)
  );
}

export function isPilotUser(user: CurrentUser): boolean {
  return hasRole(user, UserRole.PILOT);
}
