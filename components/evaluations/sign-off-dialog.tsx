"use client";

import { useActionState, useEffect, useTransition, useState } from "react";
import { EvaluationResult } from "@prisma/client";
import { signOffEvaluationAction } from "@/actions/evaluations";
import { initialActionState } from "@/lib/action-state";
import { evaluationResultLabel } from "@/lib/evaluations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

const SIGN_OFF_FORM_ID = "evaluation-sign-off-form";

type SignOffStep = "trainee" | "evaluator";

type SignOffDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationId: string;
  defaultEvaluatorName: string;
  defaultTraineeName: string;
  notes: string;
  taskPayload: string;
  onSuccess: (message: string) => void;
};

export function SignOffDialog({
  open,
  onOpenChange,
  evaluationId,
  defaultEvaluatorName,
  defaultTraineeName,
  notes,
  taskPayload,
  onSuccess,
}: SignOffDialogProps) {
  const [step, setStep] = useState<SignOffStep>("trainee");
  const [traineeSignature, setTraineeSignature] = useState(defaultTraineeName);
  const [traineeError, setTraineeError] = useState<string | null>(null);
  const [isSubmitting, startSubmit] = useTransition();

  const [state, formAction, pending] = useActionState(
    signOffEvaluationAction,
    initialActionState,
  );

  const busy = pending || isSubmitting;

  useEffect(() => {
    if (!open) {
      setStep("trainee");
      setTraineeSignature(defaultTraineeName);
      setTraineeError(null);
    }
  }, [open, defaultTraineeName]);

  useEffect(() => {
    if (state.success && state.message) {
      onSuccess(state.message);
      onOpenChange(false);
    }
  }, [state.success, state.message, onSuccess, onOpenChange]);

  function handleTraineeContinue() {
    const value = traineeSignature.trim();
    if (!value) {
      setTraineeError("Trainee must sign before the evaluator can sign off.");
      return;
    }
    setTraineeError(null);
    setStep("evaluator");
  }

  function handleEvaluatorSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("notes", notes);
    formData.set("taskPayload", taskPayload);
    startSubmit(() => {
      formAction(formData);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="space-y-4 p-6 pb-4">
          <div className="flex gap-2 text-xs font-medium">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5",
                step === "trainee"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              1. Trainee
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5",
                step === "evaluator"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              2. Evaluator
            </span>
          </div>

          {step === "trainee" ? (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>Trainee acknowledgment</DialogTitle>
                <DialogDescription>
                  The trainee reviews the evaluation and signs first. The
                  evaluator completes sign-off in the next step.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="traineeSignature">Trainee signature</Label>
                <Input
                  id="traineeSignature"
                  value={traineeSignature}
                  onChange={(event) => {
                    setTraineeSignature(event.target.value);
                    setTraineeError(null);
                  }}
                  placeholder="Type full name to sign"
                  autoComplete="name"
                />
                <p className="text-xs text-muted-foreground">
                  Expected: {defaultTraineeName}
                </p>
                {traineeError && (
                  <p className="text-sm text-destructive">{traineeError}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>Evaluator sign-off</DialogTitle>
                <DialogDescription>
                  {`Trainee signed as ${traineeSignature.trim()}. Confirm the overall result and sign to complete. Qualifications renew on pass (not on failed result).`}
                </DialogDescription>
              </DialogHeader>

              <form
                id={SIGN_OFF_FORM_ID}
                onSubmit={handleEvaluatorSubmit}
                className="space-y-4"
              >
                <input type="hidden" name="evaluationId" value={evaluationId} />
                <input
                  type="hidden"
                  name="traineeSignature"
                  value={traineeSignature.trim()}
                />

                {state.error && (
                  <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {state.error}
                  </p>
                )}

                <div className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Trainee signed:</span>{" "}
                  <span className="font-medium">{traineeSignature.trim()}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overallResult">Overall result</Label>
                  <select
                    id="overallResult"
                    name="overallResult"
                    className={selectClassName}
                    required
                    defaultValue={EvaluationResult.PASSED}
                  >
                    {Object.values(EvaluationResult).map((result) => (
                      <option key={result} value={result}>
                        {evaluationResultLabel[result]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="evaluatorSignature">Evaluator signature</Label>
                  <Input
                    id="evaluatorSignature"
                    name="evaluatorSignature"
                    defaultValue={defaultEvaluatorName}
                    required
                  />
                </div>
              </form>
            </>
          )}
        </div>

        <DialogFooter>
          {step === "trainee" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleTraineeContinue}>
                Continue to evaluator
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("trainee")}
                disabled={busy}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form={SIGN_OFF_FORM_ID}
                disabled={busy}
              >
                {busy ? "Signing off…" : "Complete sign-off"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
