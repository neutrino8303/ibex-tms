import {
  EvaluationStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import type { CurrentUser } from "@/lib/auth";
import { hasAnyRole, hasRole } from "@/lib/auth";
import { prisma } from "@/server/db";

const ADMIN_VIEW_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.AUDITOR,
];

const EVALUATOR_ROLES: UserRole[] = [UserRole.EXAMINER, UserRole.INSTRUCTOR];

export function canViewEvaluation(
  user: CurrentUser,
  evaluation: { traineeId: string; evaluatorId: string },
): boolean {
  if (hasAnyRole(user, ADMIN_VIEW_ROLES)) {
    return true;
  }
  if (hasAnyRole(user, EVALUATOR_ROLES)) {
    return evaluation.evaluatorId === user.id;
  }
  if (hasRole(user, UserRole.PILOT)) {
    return evaluation.traineeId === user.id;
  }
  return false;
}

export function canEditEvaluation(
  user: CurrentUser,
  evaluation: {
    traineeId: string;
    evaluatorId: string;
    status: EvaluationStatus;
  },
): boolean {
  if (evaluation.status === EvaluationStatus.COMPLETED) {
    return false;
  }
  if (evaluation.status === EvaluationStatus.CANCELLED) {
    return false;
  }
  if (hasAnyRole(user, [UserRole.ADMIN, UserRole.TRAINING_MANAGER])) {
    return true;
  }
  if (hasAnyRole(user, EVALUATOR_ROLES)) {
    return evaluation.evaluatorId === user.id;
  }
  return false;
}

export function canSignOffEvaluation(
  user: CurrentUser,
  evaluation: {
    evaluatorId: string;
    status: EvaluationStatus;
  },
): boolean {
  if (evaluation.status !== EvaluationStatus.ASSIGNED &&
      evaluation.status !== EvaluationStatus.IN_PROGRESS) {
    return false;
  }
  if (hasAnyRole(user, [UserRole.ADMIN, UserRole.TRAINING_MANAGER])) {
    return true;
  }
  if (hasAnyRole(user, EVALUATOR_ROLES)) {
    return evaluation.evaluatorId === user.id;
  }
  return false;
}

export function evaluationListWhere(
  user: CurrentUser,
): Prisma.EvaluationWhereInput | null {
  if (hasAnyRole(user, ADMIN_VIEW_ROLES)) {
    return {};
  }
  if (hasAnyRole(user, EVALUATOR_ROLES)) {
    return { evaluatorId: user.id };
  }
  if (hasRole(user, UserRole.PILOT)) {
    return { traineeId: user.id };
  }
  return null;
}

const evaluationDetailInclude = {
  form: {
    include: {
      sections: {
        orderBy: { order: "asc" as const },
        include: {
          tasks: {
            orderBy: { order: "asc" as const },
            include: { qualLinks: { include: { qualification: true } } },
          },
        },
      },
    },
  },
  trainee: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      base: true,
      employeeNumber: true,
    },
  },
  evaluator: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  taskResults: true,
} satisfies Prisma.EvaluationInclude;

export async function loadEvaluationDetail(id: string) {
  return prisma.evaluation.findUnique({
    where: { id },
    include: evaluationDetailInclude,
  });
}

export type EvaluationListItem = {
  id: string;
  status: EvaluationStatus;
  scheduledDate: Date;
  location: string | null;
  overallResult: string | null;
  formCode: string;
  formName: string;
  formVersion: number;
  traineeName: string;
  evaluatorName: string;
};

export async function listEvaluationsForUser(
  user: CurrentUser,
): Promise<EvaluationListItem[]> {
  const where = evaluationListWhere(user);
  if (where === null) {
    return [];
  }

  const evaluations = await prisma.evaluation.findMany({
    where,
    include: {
      form: { select: { code: true, name: true, version: true } },
      trainee: { select: { firstName: true, lastName: true } },
      evaluator: { select: { firstName: true, lastName: true } },
    },
    orderBy: [{ scheduledDate: "desc" }, { createdAt: "desc" }],
  });

  return evaluations.map((item) => ({
    id: item.id,
    status: item.status,
    scheduledDate: item.scheduledDate,
    location: item.location,
    overallResult: item.overallResult,
    formCode: item.form.code,
    formName: item.form.name,
    formVersion: item.form.version,
    traineeName: `${item.trainee.firstName} ${item.trainee.lastName}`,
    evaluatorName: `${item.evaluator.firstName} ${item.evaluator.lastName}`,
  }));
}

export async function getAllFormTasks(formId: string) {
  const form = await prisma.evaluationForm.findUnique({
    where: { id: formId, isPublished: true },
    include: {
      sections: { include: { tasks: true } },
    },
  });
  if (!form) return null;
  return form.sections.flatMap((section) => section.tasks);
}

export type EvaluationDetailRecord = NonNullable<
  Awaited<ReturnType<typeof loadEvaluationDetail>>
>;

export function mapEvaluationToWorkspaceData(
  evaluation: EvaluationDetailRecord,
) {
  const resultByTaskId = new Map(
    evaluation.taskResults.map((result) => [result.taskId, result]),
  );

  return {
    id: evaluation.id,
    status: evaluation.status,
    overallResult: evaluation.overallResult,
    scheduledDate: evaluation.scheduledDate.toISOString(),
    location: evaluation.location,
    notes: evaluation.notes,
    signedAt: evaluation.signedAt?.toISOString() ?? null,
    evaluatorSignature: evaluation.evaluatorSignature,
    traineeSignature: evaluation.traineeSignature,
    formCode: evaluation.form.code,
    formName: evaluation.form.name,
    formVersion: evaluation.form.version,
    traineeName: `${evaluation.trainee.firstName} ${evaluation.trainee.lastName}`,
    evaluatorName: `${evaluation.evaluator.firstName} ${evaluation.evaluator.lastName}`,
    traineeBase: evaluation.trainee.base,
    sections: evaluation.form.sections.map((section) => ({
      id: section.id,
      title: section.title,
      order: section.order,
      tasks: section.tasks.map((task) => {
        const result = resultByTaskId.get(task.id);
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          gradingScale: task.gradingScale,
          isMandatory: task.isMandatory,
          order: task.order,
          qualificationLabels: task.qualLinks.map(
            (link) => link.qualification.code,
          ),
          result: {
            taskId: task.id,
            passed: result?.passed ?? null,
            numericGrade: result?.numericGrade ?? null,
            ebtGrade: result?.ebtGrade ?? null,
            comment: result?.comment ?? "",
          },
        };
      }),
    })),
  };
}
