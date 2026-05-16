import { EvaluationResult, EvaluationStatus } from "@prisma/client";
import {
  evaluationResultLabel,
  evaluationStatusLabel,
} from "@/lib/evaluations";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<EvaluationStatus, string> = {
  ASSIGNED: "border-slate-200 bg-slate-100 text-slate-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-red-200 bg-red-50 text-red-800",
};

type EvaluationStatusBadgeProps = {
  status: EvaluationStatus;
  result?: EvaluationResult | null;
};

export function EvaluationStatusBadge({
  status,
  result,
}: EvaluationStatusBadgeProps) {
  if (status === "COMPLETED" && result) {
    const resultStyles =
      result === "PASSED"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : result === "FAILED"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-amber-200 bg-amber-50 text-amber-900";
    return (
      <Badge variant="outline" className={cn(resultStyles)}>
        {evaluationResultLabel[result]}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(statusStyles[status])}>
      {evaluationStatusLabel[status]}
    </Badge>
  );
}
