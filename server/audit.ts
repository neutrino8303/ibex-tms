import { prisma } from "@/server/db";

type AuditParams = {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeValue?: unknown;
  afterValue?: unknown;
};

export async function writeAuditLog({
  actorId,
  action,
  entityType,
  entityId,
  beforeValue,
  afterValue,
}: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      beforeValue: beforeValue ? JSON.stringify(beforeValue) : null,
      afterValue: afterValue ? JSON.stringify(afterValue) : null,
    },
  });
}
