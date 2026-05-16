import { QualCategory } from "@prisma/client";

export const ALL_QUAL_CATEGORIES: QualCategory[] = [
  QualCategory.TYPE_RATING,
  QualCategory.RECURRENT,
  QualCategory.MEDICAL,
  QualCategory.LICENSE,
  QualCategory.ENDORSEMENT,
  QualCategory.CURRENCY,
];

export const qualCategoryLabel: Record<QualCategory, string> = {
  TYPE_RATING: "Type rating",
  RECURRENT: "Recurrent",
  MEDICAL: "Medical",
  LICENSE: "License",
  ENDORSEMENT: "Endorsement",
  CURRENCY: "Currency",
};
