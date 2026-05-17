import { addDays } from "date-fns";
import { EvaluationResult, QualStatus } from "@prisma/client";
import { isTaskPassed } from "@/lib/evaluations";
import { toUserQualificationAuditSnapshot } from "@/lib/user-qualification-audit";
import { writeAuditLog } from "@/server/audit";
import { prisma } from "@/server/db";
import { recomputeAllEffectiveExpiriesForUser } from "@/server/qualification-expiry";

export async function renewQualificationsForEvaluation(
  evaluationId: string,
  actorId: string,
): Promise<number> {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
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
    throw new Error("Evaluation not found");
  }

  if (evaluation.overallResult === EvaluationResult.FAILED) {
    return 0;
  }

  if (!evaluation.signedAt) {
    throw new Error("Evaluation must be signed off before renewing qualifications");
  }

  const tasksById = new Map(
    evaluation.form.sections.flatMap((section) => section.tasks).map((task) => [
      task.id,
      task,
    ]),
  );

  const qualificationIds = new Set<string>();

  for (const result of evaluation.taskResults) {
    const task = tasksById.get(result.taskId);
    if (!task) continue;

    if (
      isTaskPassed(task.gradingScale, {
        passed: result.passed,
        numericGrade: result.numericGrade,
        ebtGrade: result.ebtGrade,
      })
    ) {
      for (const link of task.qualLinks) {
        qualificationIds.add(link.qualificationId);
      }
    }
  }

  let renewedCount = 0;
  const signedAt = evaluation.signedAt;

  for (const qualificationId of qualificationIds) {
    const qualification = await prisma.qualification.findUnique({
      where: { id: qualificationId },
    });
    if (!qualification) continue;

    const originalExpiryDate = addDays(signedAt, qualification.validityPeriodDays);

    const existing = await prisma.userQualification.findFirst({
      where: {
        userId: evaluation.traineeId,
        qualificationId,
      },
      include: { qualification: true },
    });

    const userQualification = existing
      ? await prisma.userQualification.update({
          where: { id: existing.id },
          data: {
            issuedDate: signedAt,
            originalExpiryDate,
            expiryDate: originalExpiryDate,
            limitedByQualificationId: null,
            status: QualStatus.VALID,
            linkedEvaluationId: evaluationId,
          },
          include: { qualification: true },
        })
      : await prisma.userQualification.create({
          data: {
            userId: evaluation.traineeId,
            qualificationId,
            issuedDate: signedAt,
            originalExpiryDate,
            expiryDate: originalExpiryDate,
            limitedByQualificationId: null,
            status: QualStatus.VALID,
            linkedEvaluationId: evaluationId,
          },
          include: { qualification: true },
        });

    const beforeValue = existing
      ? toUserQualificationAuditSnapshot(existing)
      : null;

    await writeAuditLog({
      actorId,
      action: "QUAL_RENEWED",
      entityType: "UserQualification",
      entityId: userQualification.id,
      beforeValue,
      afterValue: toUserQualificationAuditSnapshot({
        ...userQualification,
        notes: `Evaluation sign-off ${evaluationId}`,
      }),
    });

    renewedCount += 1;
  }

  await recomputeAllEffectiveExpiriesForUser(evaluation.traineeId);

  return renewedCount;
}
