import {
  describeAuditChanges,
  parseAuditSnapshot,
  userQualificationAuditActionLabel,
  USER_QUALIFICATION_AUDIT_ACTIONS,
} from "@/lib/user-qualification-audit";
import { prisma } from "@/server/db";

export type UserQualificationHistoryEntry = {
  id: string;
  action: string;
  actionLabel: string;
  timestamp: Date;
  actorName: string;
  actorEmail: string;
  changes: string[];
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
};

export async function getUserQualificationHistory(
  userQualificationId: string,
): Promise<UserQualificationHistoryEntry[]> {
  const logs = await prisma.auditLog.findMany({
    where: {
      entityType: "UserQualification",
      entityId: userQualificationId,
      action: { in: [...USER_QUALIFICATION_AUDIT_ACTIONS] },
    },
    include: {
      actor: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
  });

  return logs.map((log) => {
    const before = parseAuditSnapshot(log.beforeValue);
    const after = parseAuditSnapshot(log.afterValue);
    return {
      id: log.id,
      action: log.action,
      actionLabel: userQualificationAuditActionLabel[log.action] ?? log.action,
      timestamp: log.timestamp,
      actorName: `${log.actor.firstName} ${log.actor.lastName}`,
      actorEmail: log.actor.email,
      changes: describeAuditChanges(before, after),
      before: before as Record<string, unknown> | null,
      after: after as Record<string, unknown> | null,
    };
  });
}
