"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft } from "lucide-react";
import { createEvaluationAction } from "@/actions/evaluations";
import { initialActionState } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
);

export type FormOption = {
  id: string;
  label: string;
};

export type UserOption = {
  id: string;
  label: string;
};

type CreateEvaluationFormProps = {
  forms: FormOption[];
  pilots: UserOption[];
  evaluators: UserOption[];
};

export function CreateEvaluationForm({
  forms,
  pilots,
  evaluators,
}: CreateEvaluationFormProps) {
  const [state, formAction, pending] = useActionState(
    createEvaluationAction,
    initialActionState,
  );

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href="/evaluations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to evaluations
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Schedule evaluation
        </h1>
        <p className="text-muted-foreground">
          Assign a published form to a pilot and examiner.
        </p>
      </div>

      <form action={formAction} className="space-y-4 rounded-xl border bg-card p-6">
        {state.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="formId">Evaluation form</Label>
          <select id="formId" name="formId" className={selectClassName} required>
            <option value="">Select published form…</option>
            {forms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="traineeId">Trainee (pilot)</Label>
          <select
            id="traineeId"
            name="traineeId"
            className={selectClassName}
            required
          >
            <option value="">Select pilot…</option>
            {pilots.map((pilot) => (
              <option key={pilot.id} value={pilot.id}>
                {pilot.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="evaluatorId">Evaluator</Label>
          <select
            id="evaluatorId"
            name="evaluatorId"
            className={selectClassName}
            required
          >
            <option value="">Select examiner / instructor…</option>
            {evaluators.map((evaluator) => (
              <option key={evaluator.id} value={evaluator.id}>
                {evaluator.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Scheduled date</Label>
          <Input
            id="scheduledDate"
            name="scheduledDate"
            type="datetime-local"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location (optional)</Label>
          <Input
            id="location"
            name="location"
            placeholder="SIM-1 Lisbon"
          />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Create evaluation"}
        </Button>
      </form>
    </div>
  );
}
