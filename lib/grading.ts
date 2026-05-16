import { GradingScale } from "@prisma/client";

export const ALL_GRADING_SCALES: GradingScale[] = [
  GradingScale.PASS_FAIL,
  GradingScale.ONE_TO_FIVE,
  GradingScale.EBT_COMPETENCY,
];

export const gradingScaleLabel: Record<GradingScale, string> = {
  PASS_FAIL: "Pass / Fail",
  ONE_TO_FIVE: "1–5 scale",
  EBT_COMPETENCY: "EBT competency",
};
