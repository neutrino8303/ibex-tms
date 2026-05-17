import type { UserQualificationAuditSnapshot } from "@/lib/user-qualification-audit";

const RENEWAL_ACTIONS = new Set([
  "USER_QUALIFICATION_RENEWED",
  "QUAL_RENEWED",
]);

type HistoryEntryForDates = {
  action: string;
  timestamp: Date;
  after: UserQualificationAuditSnapshot | null;
};

function parseSnapshotIssuedDate(
  snapshot: UserQualificationAuditSnapshot | null,
): Date | null {
  if (!snapshot?.issuedDate) {
    return null;
  }
  const date = new Date(snapshot.issuedDate);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function deriveQualificationLifecycleDates(
  history: HistoryEntryForDates[],
  currentIssuedDate: Date,
): {
  initialAcquisitionDate: Date;
  lastRenewalDate: Date | null;
} {
  const chronological = [...history].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  const created = chronological.find(
    (entry) => entry.action === "USER_QUALIFICATION_CREATED",
  );
  const initialFromAudit = parseSnapshotIssuedDate(created?.after ?? null);

  const renewals = chronological.filter((entry) =>
    RENEWAL_ACTIONS.has(entry.action),
  );
  const lastRenewal = renewals[renewals.length - 1];
  const lastRenewalFromAudit = parseSnapshotIssuedDate(lastRenewal?.after ?? null);

  return {
    initialAcquisitionDate: initialFromAudit ?? currentIssuedDate,
    lastRenewalDate: lastRenewalFromAudit,
  };
}
