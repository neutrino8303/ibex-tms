export const USER_QUALIFICATION_AUDIT_ACTIONS = [
  "USER_QUALIFICATION_CREATED",
  "USER_QUALIFICATION_UPDATED",
  "USER_QUALIFICATION_RENEWED",
  "QUAL_RENEWED",
] as const;

export type UserQualificationAuditAction =
  (typeof USER_QUALIFICATION_AUDIT_ACTIONS)[number];

export const userQualificationAuditActionLabel: Record<
  string,
  string
> = {
  USER_QUALIFICATION_CREATED: "Created",
  USER_QUALIFICATION_UPDATED: "Updated",
  USER_QUALIFICATION_RENEWED: "Renewed (manual)",
  QUAL_RENEWED: "Renewed (evaluation sign-off)",
};

export type UserQualificationAuditSnapshot = {
  qualificationCode?: string;
  qualificationName?: string;
  issuedDate?: string;
  originalExpiryDate?: string;
  expiryDate?: string;
  issuingAuthority?: string | null;
  status?: string;
  linkedEvaluationId?: string | null;
  notes?: string;
};

export function parseAuditSnapshot(
  raw: string | null,
): UserQualificationAuditSnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserQualificationAuditSnapshot;
  } catch {
    return null;
  }
}

const FIELD_LABELS: Record<keyof UserQualificationAuditSnapshot, string> = {
  qualificationCode: "Code",
  qualificationName: "Qualification",
  issuedDate: "Issued",
  originalExpiryDate: "Original expiry",
  expiryDate: "Effective expiry",
  issuingAuthority: "Authority",
  status: "Status",
  linkedEvaluationId: "Linked evaluation",
  notes: "Notes",
};

function formatFieldValue(key: keyof UserQualificationAuditSnapshot, value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (
    key === "issuedDate" ||
    key === "originalExpiryDate" ||
    key === "expiryDate"
  ) {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }
  return String(value);
}

export function describeAuditChanges(
  before: UserQualificationAuditSnapshot | null,
  after: UserQualificationAuditSnapshot | null,
): string[] {
  const keys = Object.keys(FIELD_LABELS) as (keyof UserQualificationAuditSnapshot)[];
  const lines: string[] = [];

  for (const key of keys) {
    const beforeVal = before?.[key];
    const afterVal = after?.[key];
    if (beforeVal === afterVal) continue;
    if (beforeVal === undefined && afterVal === undefined) continue;

    const label = FIELD_LABELS[key];
    if (beforeVal === undefined || before === null) {
      lines.push(`${label}: set to ${formatFieldValue(key, afterVal)}`);
    } else if (afterVal === undefined || after === null) {
      lines.push(`${label}: was ${formatFieldValue(key, beforeVal)}`);
    } else {
      lines.push(
        `${label}: ${formatFieldValue(key, beforeVal)} → ${formatFieldValue(key, afterVal)}`,
      );
    }
  }

  if (lines.length === 0 && after && !before) {
    lines.push("Record created");
  }

  return lines;
}

export function toUserQualificationAuditSnapshot(record: {
  qualification: { code: string; name: string };
  issuedDate: Date;
  originalExpiryDate: Date;
  expiryDate: Date;
  issuingAuthority: string | null;
  status: string;
  linkedEvaluationId?: string | null;
  notes?: string;
}): UserQualificationAuditSnapshot {
  return {
    qualificationCode: record.qualification.code,
    qualificationName: record.qualification.name,
    issuedDate: record.issuedDate.toISOString(),
    originalExpiryDate: record.originalExpiryDate.toISOString(),
    expiryDate: record.expiryDate.toISOString(),
    issuingAuthority: record.issuingAuthority,
    status: record.status,
    linkedEvaluationId: record.linkedEvaluationId ?? null,
    notes: record.notes,
  };
}
