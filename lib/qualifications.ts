import { differenceInDays, startOfDay } from "date-fns";
import { QualStatus } from "@prisma/client";

export function computeStatus(
  expiryDate: Date,
  options?: { storedStatus?: QualStatus; now?: Date },
): QualStatus {
  if (options?.storedStatus === QualStatus.SUSPENDED) {
    return QualStatus.SUSPENDED;
  }

  const now = startOfDay(options?.now ?? new Date());
  const expiry = startOfDay(expiryDate);
  const daysRemaining = differenceInDays(expiry, now);

  if (daysRemaining < 0) {
    return QualStatus.EXPIRED;
  }
  if (daysRemaining <= 30) {
    return QualStatus.EXPIRING_SOON;
  }
  return QualStatus.VALID;
}

export function daysUntilExpiry(
  expiryDate: Date,
  now: Date = new Date(),
): number {
  return differenceInDays(startOfDay(expiryDate), startOfDay(now));
}

export const qualStatusLabel: Record<QualStatus, string> = {
  VALID: "Valid",
  EXPIRING_SOON: "Expiring soon",
  EXPIRED: "Expired",
  SUSPENDED: "Suspended",
};

export type QualStatusBadgeVariant =
  | "valid"
  | "expiring"
  | "expired"
  | "suspended";

export function qualStatusBadgeVariant(
  status: QualStatus,
): QualStatusBadgeVariant {
  switch (status) {
    case QualStatus.VALID:
      return "valid";
    case QualStatus.EXPIRING_SOON:
      return "expiring";
    case QualStatus.EXPIRED:
      return "expired";
    case QualStatus.SUSPENDED:
      return "suspended";
    default:
      return "valid";
  }
}
