"use client";

import { GradingScale } from "@prisma/client";
import { EBT_GRADE_OPTIONS } from "@/lib/evaluations";
import { gradingScaleLabel } from "@/lib/grading";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-8 w-full max-w-xs rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
);

export type TaskResultState = {
  taskId: string;
  passed: boolean | null;
  numericGrade: number | null;
  ebtGrade: string | null;
  comment: string;
};

type TaskResultRowProps = {
  title: string;
  description: string | null;
  gradingScale: GradingScale;
  isMandatory: boolean;
  qualificationLabels: string[];
  value: TaskResultState;
  readOnly: boolean;
  onChange: (value: TaskResultState) => void;
};

export function TaskResultRow({
  title,
  description,
  gradingScale,
  isMandatory,
  qualificationLabels,
  value,
  readOnly,
  onChange,
}: TaskResultRowProps) {
  return (
    <div className="space-y-3 border-b border-border/60 py-4 last:border-0">
      <div>
        <p className="font-medium">
          {title}
          {isMandatory && (
            <span className="ml-1 text-xs text-destructive">*</span>
          )}
        </p>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
        {qualificationLabels.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            Renews: {qualificationLabels.join(", ")}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {gradingScaleLabel[gradingScale]}
        </p>
      </div>

      {gradingScale === "PASS_FAIL" && (
        <RadioGroup
          value={
            value.passed === null ? "" : value.passed ? "pass" : "fail"
          }
          onValueChange={(next) => {
            if (readOnly) return;
            onChange({
              ...value,
              passed: next === "pass" ? true : next === "fail" ? false : null,
            });
          }}
          className="flex flex-row gap-4"
          disabled={readOnly}
        >
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="pass" />
            Pass
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="fail" />
            Fail
          </label>
        </RadioGroup>
      )}

      {gradingScale === "ONE_TO_FIVE" && (
        <RadioGroup
          value={value.numericGrade?.toString() ?? ""}
          onValueChange={(next) => {
            if (readOnly) return;
            onChange({
              ...value,
              numericGrade: next ? Number(next) : null,
            });
          }}
          className="flex flex-row flex-wrap gap-3"
          disabled={readOnly}
        >
          {[1, 2, 3, 4, 5].map((grade) => (
            <label key={grade} className="flex items-center gap-2 text-sm">
              <RadioGroupItem value={String(grade)} />
              {grade}
            </label>
          ))}
        </RadioGroup>
      )}

      {gradingScale === "EBT_COMPETENCY" && (
        <div className="space-y-2">
          <Label>EBT grade</Label>
          <select
            className={selectClassName}
            value={value.ebtGrade ?? ""}
            disabled={readOnly}
            onChange={(event) =>
              onChange({
                ...value,
                ebtGrade: event.target.value || null,
              })
            }
          >
            <option value="">Select…</option>
            {EBT_GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Comment</Label>
        <Textarea
          value={value.comment}
          onChange={(event) =>
            onChange({ ...value, comment: event.target.value })
          }
          rows={2}
          disabled={readOnly}
          placeholder="Optional examiner notes"
        />
      </div>
    </div>
  );
}
