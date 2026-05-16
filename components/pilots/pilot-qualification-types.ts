import type { QualStatus } from "@prisma/client";

export type QualificationOption = {
  id: string;
  code: string;
  name: string;
  validityPeriodDays: number;
  alreadyAssigned: boolean;
};

export type PilotQualificationRow = {
  id: string;
  qualificationId: string;
  code: string;
  name: string;
  validityPeriodDays: number;
  issuedDate: Date;
  expiryDate: Date;
  issuingAuthority: string | null;
  storedStatus: QualStatus;
  displayStatus: QualStatus;
  daysRemaining: number;
};
