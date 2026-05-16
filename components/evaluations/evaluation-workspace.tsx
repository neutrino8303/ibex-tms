"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useActionState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Save, Send } from "lucide-react";
import {
  EvaluationResult,
  EvaluationStatus,
  GradingScale,
} from "@prisma/client";
import { saveEvaluationProgressAction } from "@/actions/evaluations";
import { initialActionState } from "@/lib/action-state";
import { EvaluationStatusBadge } from "@/components/evaluations/evaluation-status-badge";
import { SignOffDialog } from "@/components/evaluations/sign-off-dialog";
import {
  TaskResultRow,
  type TaskResultState,
} from "@/components/evaluations/task-result-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export type EvaluationTaskView = {
  id: string;
  title: string;
  description: string | null;
  gradingScale: GradingScale;
  isMandatory: boolean;
  order: number;
  qualificationLabels: string[];
  result: TaskResultState;
};

export type EvaluationSectionView = {
  id: string;
  title: string;
  order: number;
  tasks: EvaluationTaskView[];
};

export type EvaluationWorkspaceData = {
  id: string;
  status: EvaluationStatus;
  overallResult: EvaluationResult | null;
  scheduledDate: string;
  location: string | null;
  notes: string | null;
  signedAt: string | null;
  evaluatorSignature: string | null;
  traineeSignature: string | null;
  formCode: string;
  formName: string;
  formVersion: number;
  traineeName: string;
  evaluatorName: string;
  traineeBase: string | null;
  sections: EvaluationSectionView[];
};

type EvaluationWorkspaceProps = {
  evaluation: EvaluationWorkspaceData;
  canEdit: boolean;
  canSignOff: boolean;
  currentUserName: string;
};

export function EvaluationWorkspace({
  evaluation,
  canEdit,
  canSignOff,
  currentUserName,
}: EvaluationWorkspaceProps) {
  const router = useRouter();
  const [taskResults, setTaskResults] = useState<Record<string, TaskResultState>>(
    () => {
      const map: Record<string, TaskResultState> = {};
      for (const section of evaluation.sections) {
        for (const task of section.tasks) {
          map[task.id] = { ...task.result };
        }
      }
      return map;
    },
  );
  const [notes, setNotes] = useState(evaluation.notes ?? "");
  const [signOffOpen, setSignOffOpen] = useState(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const [saveState, saveAction, savePending] = useActionState(
    saveEvaluationProgressAction,
    initialActionState,
  );

  const readOnly = !canEdit || evaluation.status === EvaluationStatus.COMPLETED;

  const payload = useMemo(
    () => ({
      evaluationId: evaluation.id,
      notes,
      taskResults: Object.values(taskResults),
    }),
    [evaluation.id, notes, taskResults],
  );

  function handleSaveSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const input = form.elements.namedItem("payload") as HTMLInputElement;
    input.value = JSON.stringify(payload);
  }

  const statusMessage = saveState.message ?? flashMessage;
  const statusError = saveState.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/evaluations"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to evaluations
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {evaluation.formName}
          </h1>
          <p className="text-muted-foreground">
            <span className="font-mono">{evaluation.formCode}</span> · v
            {evaluation.formVersion}
          </p>
          <div className="mt-2">
            <EvaluationStatusBadge
              status={evaluation.status}
              result={evaluation.overallResult}
            />
          </div>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <form action={saveAction} onSubmit={handleSaveSubmit}>
              <input type="hidden" name="payload" defaultValue="" />
              <Button type="submit" variant="outline" disabled={savePending}>
                <Save className="size-4" />
                {savePending ? "Saving…" : "Save progress"}
              </Button>
            </form>
            {canSignOff && (
              <Button type="button" onClick={() => setSignOffOpen(true)}>
                <Send className="size-4" />
                Sign off
              </Button>
            )}
          </div>
        )}
      </div>

      {(statusError || statusMessage) && (
        <p
          className={
            statusError
              ? "rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              : "rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          }
        >
          {statusError ?? statusMessage}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Trainee
            </p>
            <p className="mt-1 text-sm font-medium">{evaluation.traineeName}</p>
            {evaluation.traineeBase && (
              <p className="text-xs text-muted-foreground">
                {evaluation.traineeBase}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Evaluator
            </p>
            <p className="mt-1 text-sm font-medium">{evaluation.evaluatorName}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Scheduled
            </p>
            <p className="mt-1 text-sm font-medium">
              {format(new Date(evaluation.scheduledDate), "dd MMM yyyy HH:mm")}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Location
            </p>
            <p className="mt-1 text-sm font-medium">
              {evaluation.location ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {evaluation.status === EvaluationStatus.COMPLETED && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sign-off record</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              <span className="text-muted-foreground">Trainee:</span>{" "}
              {evaluation.traineeSignature}
            </p>
            <p>
              <span className="text-muted-foreground">Evaluator:</span>{" "}
              {evaluation.evaluatorSignature}
            </p>
            {evaluation.signedAt && (
              <p className="sm:col-span-2">
                <span className="text-muted-foreground">Signed at:</span>{" "}
                {format(new Date(evaluation.signedAt), "dd MMM yyyy HH:mm")} UTC
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {evaluation.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="text-base">{section.title}</CardTitle>
            <CardDescription>
              {section.tasks.length} task
              {section.tasks.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {section.tasks.map((task) => (
              <TaskResultRow
                key={task.id}
                title={task.title}
                description={task.description}
                gradingScale={task.gradingScale}
                isMandatory={task.isMandatory}
                qualificationLabels={task.qualificationLabels}
                value={taskResults[task.id]}
                readOnly={readOnly}
                onChange={(next) =>
                  setTaskResults((current) => ({
                    ...current,
                    [task.id]: next,
                  }))
                }
              />
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evaluation notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="eval-notes" className="sr-only">
            Notes
          </Label>
          <Textarea
            id="eval-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            disabled={readOnly}
            placeholder="Overall comments for this evaluation"
          />
        </CardContent>
      </Card>

      {canSignOff && !readOnly && (
        <SignOffDialog
          open={signOffOpen}
          onOpenChange={setSignOffOpen}
          evaluationId={evaluation.id}
          defaultEvaluatorName={currentUserName}
          defaultTraineeName={evaluation.traineeName}
          notes={notes}
          taskPayload={JSON.stringify(payload)}
          onSuccess={(message) => {
            setFlashMessage(message);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
