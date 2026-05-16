import {
  EvaluationResult,
  EvaluationStatus,
  GradingScale,
} from "@prisma/client";

export type TaskResultInput = {
  passed: boolean | null;
  numericGrade: number | null;
  ebtGrade: string | null;
};

export function isTaskPassed(
  gradingScale: GradingScale,
  result: TaskResultInput,
): boolean {
  switch (gradingScale) {
    case GradingScale.PASS_FAIL:
      return result.passed === true;
    case GradingScale.ONE_TO_FIVE:
      return (result.numericGrade ?? 0) >= 3;
    case GradingScale.EBT_COMPETENCY:
      return ["3", "4", "5"].includes(result.ebtGrade ?? "");
    default:
      return false;
  }
}

export const evaluationStatusLabel: Record<EvaluationStatus, string> = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const evaluationResultLabel: Record<EvaluationResult, string> = {
  PASSED: "Passed",
  FAILED: "Failed",
  PARTIAL: "Partial",
};

export const EBT_GRADE_OPTIONS = ["1", "2", "3", "4", "5"] as const;
