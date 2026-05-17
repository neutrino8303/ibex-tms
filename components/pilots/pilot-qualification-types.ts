import type { QualStatus } from "@prisma/client";

export type QualificationOption = {
  id: string;
  code: string;
  name: string;
  validityPeriodDays: number;
  alreadyAssigned: boolean;
};

export type QualificationConditionalRef = {
  id: string;
  code: string;
  name: string;
};

export type PilotQualificationRow = {
  id: string;
  qualificationId: string;
  code: string;
  name: string;
  validityPeriodDays: number;
  issuedDate: Date;
  originalExpiryDate: Date;
  expiryDate: Date;
  expiryReducedByName: string | null;
  conditionals: QualificationConditionalRef[];
  issuingAuthority: string | null;
  storedStatus: QualStatus;
  displayStatus: QualStatus;
  daysRemaining: number;
};
