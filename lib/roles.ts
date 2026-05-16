import { UserRole } from "@prisma/client";

export const ALL_USER_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.EXAMINER,
  UserRole.INSTRUCTOR,
  UserRole.PILOT,
  UserRole.AUDITOR,
];

export const userRoleLabel: Record<UserRole, string> = {
  ADMIN: "Admin",
  TRAINING_MANAGER: "Training manager",
  EXAMINER: "Examiner",
  INSTRUCTOR: "Instructor",
  PILOT: "Pilot",
  AUDITOR: "Auditor",
};

export const qualCategoryLabel: Record<string, string> = {
  TYPE_RATING: "Type rating",
  RECURRENT: "Recurrent",
  MEDICAL: "Medical",
  LICENSE: "License",
  ENDORSEMENT: "Endorsement",
  CURRENCY: "Currency",
};
