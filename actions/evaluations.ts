"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  EvaluationResult,
  EvaluationStatus,
  GradingScale,
} from "@prisma/client";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/server/audit";
import { prisma } from "@/server/db";
import {
  canEditEvaluation,
  canSignOffEvaluation,
  getAllFormTasks,
} from "@/server/evaluations";
import { renewQualificationsForEvaluation } from "@/server/qualificationEngine";
import { requireAdminActorId } from "@/server/require-admin";

const createEvaluationSchema = z.object({
  formId: z.string().min(1),
  traineeId: z.string().min(1),
  evaluatorId: z.string().min(1),
  scheduledDate: z.string().min(1),
  location: z.string().optional(),
});

const taskResultSchema = z.object({
  taskId: z.string(),
  passed: z.boolean().nullable().optional(),
  numericGrade: z.coerce.number().int().min(1).max(5).nullable().optional(),
  ebtGrade: z.string().nullable().optional(),
  comment: z.string().optional(),
});

const saveProgressSchema = z.object({
  evaluationId: z.string().min(1),
  taskResults: z.array(taskResultSchema),
  notes: z.string().optional(),
});

const signOffSchema = z.object({
  evaluationId: z.string().min(1),
  evaluatorSignature: z.string().min(1, "Evaluator signature is required"),
  traineeSignature: z.string().min(1, "Trainee acknowledgment is required"),
  overallResult: z.nativeEnum(EvaluationResult),
  notes: z.string().optional(),
});

type SaveProgressInput = z.infer<typeof saveProgressSchema>;

type EvaluationForProgress = {
  id: string;
  status: EvaluationStatus;
  form: {
    sections: { tasks: { id: string; gradingScale: GradingScale }[] }[];
  };
};

async function persistEvaluationProgress(
  evaluation: EvaluationForProgress,
  data: SaveProgressInput,
) {
  const tasksById = new Map(
    evaluation.form.sections.flatMap((s) => s.tasks).map((t) => [t.id, t]),
  );

  await prisma.$transaction(async (tx) => {
    for (const result of data.taskResults) {
      const task = tasksById.get(result.taskId);
      if (!task) continue;

      await tx.evaluationTaskResult.updateMany({
        where: {
          evaluationId: evaluation.id,
          taskId: result.taskId,
        },
        data: {
          passed:
            task.gradingScale === GradingScale.PASS_FAIL
              ? (result.passed ?? null)
              : null,
          numericGrade:
            task.gradingScale === GradingScale.ONE_TO_FIVE
              ? (result.numericGrade ?? null)
              : null,
          ebtGrade:
            task.gradingScale === GradingScale.EBT_COMPETENCY
              ? (result.ebtGrade ?? null)
              : null,
          comment: result.comment?.trim() || null,
        },
      });
    }

    await tx.evaluation.update({
      where: { id: evaluation.id },
      data: {
        notes: data.notes?.trim() || null,
        ...(evaluation.status === EvaluationStatus.ASSIGNED
          ? { status: EvaluationStatus.IN_PROGRESS }
          : {}),
      },
    });
  });
}

export async function createEvaluationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdminActorId();

  const parsed = createEvaluationSchema.safeParse({
    formId: formData.get("formId"),
    traineeId: formData.get("traineeId"),
    evaluatorId: formData.get("evaluatorId"),
    scheduledDate: formData.get("scheduledDate"),
    location: formData.get("location")?.toString().trim() || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const tasks = await getAllFormTasks(parsed.data.formId);
  if (!tasks || tasks.length === 0) {
    return { error: "Selected form is not published or has no tasks" };
  }

  const scheduledDate = new Date(parsed.data.scheduledDate);
  if (Number.isNaN(scheduledDate.getTime())) {
    return { error: "Invalid scheduled date" };
  }

  const evaluation = await prisma.evaluation.create({
    data: {
      formId: parsed.data.formId,
      traineeId: parsed.data.traineeId,
      evaluatorId: parsed.data.evaluatorId,
      scheduledDate,
      location: parsed.data.location ?? null,
      status: EvaluationStatus.ASSIGNED,
      taskResults: {
        create: tasks.map((task) => ({ taskId: task.id })),
      },
    },
  });

  revalidatePath("/evaluations");
  redirect(`/evaluations/${evaluation.id}`);
}

export async function saveEvaluationProgressAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const raw = formData.get("payload");
  if (!raw || typeof raw !== "string") {
    return { error: "Invalid payload" };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: "Invalid JSON payload" };
  }

  const parsed = saveProgressSchema.safeParse(json);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: parsed.data.evaluationId },
    include: {
      taskResults: true,
      form: {
        include: {
          sections: { include: { tasks: true } },
        },
      },
    },
  });

  if (!evaluation) {
    return { error: "Evaluation not found" };
  }

  if (!canEditEvaluation(user, evaluation)) {
    return { error: "You cannot edit this evaluation" };
  }

  await persistEvaluationProgress(evaluation, parsed.data);

  revalidatePath(`/evaluations/${evaluation.id}`);
  revalidatePath("/evaluations");
  return { success: true, message: "Progress saved" };
}

export async function signOffEvaluationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = signOffSchema.safeParse({
    evaluationId: formData.get("evaluationId"),
    evaluatorSignature: formData.get("evaluatorSignature"),
    traineeSignature: formData.get("traineeSignature"),
    overallResult: formData.get("overallResult"),
    notes: formData.get("notes")?.toString().trim() || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const taskPayloadRaw = formData.get("taskPayload");
  if (taskPayloadRaw && typeof taskPayloadRaw === "string") {
    let taskJson: unknown;
    try {
      taskJson = JSON.parse(taskPayloadRaw);
    } catch {
      return { error: "Invalid task payload" };
    }

    const taskParsed = saveProgressSchema.safeParse(taskJson);
    if (!taskParsed.success) {
      return { fieldErrors: taskParsed.error.flatten().fieldErrors };
    }

    const draftEvaluation = await prisma.evaluation.findUnique({
      where: { id: parsed.data.evaluationId },
      include: {
        taskResults: true,
        form: {
          include: {
            sections: { include: { tasks: true } },
          },
        },
      },
    });

    if (!draftEvaluation) {
      return { error: "Evaluation not found" };
    }

    if (!canEditEvaluation(user, draftEvaluation)) {
      return { error: "You cannot edit this evaluation" };
    }

    await persistEvaluationProgress(draftEvaluation, taskParsed.data);
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: parsed.data.evaluationId },
    include: {
      taskResults: true,
      form: {
        include: {
          sections: {
            include: {
              tasks: { include: { qualLinks: true } },
            },
          },
        },
      },
    },
  });

  if (!evaluation) {
    return { error: "Evaluation not found" };
  }

  if (!canSignOffEvaluation(user, evaluation)) {
    return { error: "You cannot sign off this evaluation" };
  }

  const tasksById = new Map(
    evaluation.form.sections.flatMap((s) => s.tasks).map((t) => [t.id, t]),
  );

  for (const task of tasksById.values()) {
    if (!task.isMandatory) continue;
    const result = evaluation.taskResults.find((r) => r.taskId === task.id);
    if (!result) {
      return { error: `Missing result for mandatory task: ${task.title}` };
    }
    const hasGrade =
      task.gradingScale === GradingScale.PASS_FAIL
        ? result.passed !== null
        : task.gradingScale === GradingScale.ONE_TO_FIVE
          ? result.numericGrade !== null
          : result.ebtGrade !== null && result.ebtGrade !== "";
    if (!hasGrade) {
      return { error: `Grade required for mandatory task: ${task.title}` };
    }
  }

  const signedAt = new Date();

  await prisma.evaluation.update({
    where: { id: evaluation.id },
    data: {
      status: EvaluationStatus.COMPLETED,
      overallResult: parsed.data.overallResult,
      evaluatorSignature: parsed.data.evaluatorSignature,
      traineeSignature: parsed.data.traineeSignature,
      signedAt,
      notes: parsed.data.notes ?? null,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "EVAL_SIGNED_OFF",
    entityType: "Evaluation",
    entityId: evaluation.id,
    afterValue: {
      overallResult: parsed.data.overallResult,
      signedAt: signedAt.toISOString(),
    },
  });

  let renewedCount = 0;
  if (parsed.data.overallResult !== EvaluationResult.FAILED) {
    renewedCount = await renewQualificationsForEvaluation(
      evaluation.id,
      user.id,
    );
  }

  revalidatePath(`/evaluations/${evaluation.id}`);
  revalidatePath("/evaluations");
  revalidatePath("/dashboard/expiring");
  revalidatePath(`/pilots/${evaluation.traineeId}`);

  return {
    success: true,
    message:
      parsed.data.overallResult === EvaluationResult.FAILED
        ? "Evaluation signed off. No qualifications renewed (failed result)."
        : `Evaluation signed off. ${renewedCount} qualification(s) renewed.`,
  };
}
