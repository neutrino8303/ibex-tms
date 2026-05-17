/**
 * Adds sample forms, evaluations, and qualification updates on top of existing seed data.
 * Run: pnpm exec tsx scripts/add-demo-activity.ts
 */
import {
  EvaluationResult,
  EvaluationStatus,
  GradingScale,
  QualStatus,
  PrismaClient,
  UserRole,
} from "@prisma/client";
import { addDays, subDays } from "date-fns";
import { toUserQualificationAuditSnapshot } from "../lib/user-qualification-audit";
import { recomputeAllEffectiveExpiriesForUser } from "../server/qualification-expiry";
import { renewQualificationsForEvaluation } from "../server/qualificationEngine";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const admin = await prisma.user.findUnique({
    where: { email: "admin@tms.local" },
  });
  if (!admin) {
    throw new Error("Run prisma seed first (admin@tms.local missing)");
  }

  const examiner = await prisma.user.findFirst({
    where: { email: "examiner.silva@tms.local" },
  });
  if (!examiner) throw new Error("Examiner not found");

  const pilots = await prisma.user.findMany({
    where: { roles: { some: { role: UserRole.PILOT } } },
    orderBy: [{ lastName: "asc" }],
  });
  if (pilots.length < 3) throw new Error("Need at least 3 pilots");

  const qualByCode = Object.fromEntries(
    (await prisma.qualification.findMany()).map((q) => [q.code, q]),
  );

  const pedro = pilots.find((p) => p.email === "pilot.almeida@tms.local") ?? pilots[0];
  const ines = pilots.find((p) => p.email === "pilot.santos@tms.local") ?? pilots[1];
  const miguel = pilots.find((p) => p.email === "pilot.oliveira@tms.local") ?? pilots[2];
  const beatriz =
    pilots.find((p) => p.email === "pilot.carvalho@tms.local") ??
    pilots[pilots.length - 1];

  // —— New evaluation forms ——
  const lineForm = await prisma.evaluationForm.create({
    data: {
      code: "LINE-A320",
      name: "A320 Line Check",
      version: 1,
      isPublished: true,
      publishedAt: now,
      applicableRoles: JSON.stringify([UserRole.PILOT]),
      defaultGradingScale: GradingScale.PASS_FAIL,
      createdById: admin.id,
      sections: {
        create: [
          {
            title: "Line operations",
            order: 1,
            tasks: {
              create: [
                {
                  title: "Normal line procedures",
                  gradingScale: GradingScale.PASS_FAIL,
                  order: 1,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["A320-LINE"].id }],
                  },
                },
                {
                  title: "Weather & dispatch decisions",
                  gradingScale: GradingScale.PASS_FAIL,
                  order: 2,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["A320-LINE"].id }],
                  },
                },
              ],
            },
          },
          {
            title: "Passenger & security",
            order: 2,
            tasks: {
              create: [
                {
                  title: "Cabin safety briefing compliance",
                  gradingScale: GradingScale.PASS_FAIL,
                  order: 1,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["SEC-AWR"].id }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: { sections: { include: { tasks: true } } },
  });

  const crmForm = await prisma.evaluationForm.create({
    data: {
      code: "CRM-WS",
      name: "CRM Workshop & Assessment",
      version: 1,
      isPublished: true,
      publishedAt: now,
      applicableRoles: JSON.stringify([UserRole.PILOT]),
      defaultGradingScale: GradingScale.ONE_TO_FIVE,
      createdById: admin.id,
      sections: {
        create: [
          {
            title: "CRM competencies",
            order: 1,
            tasks: {
              create: [
                {
                  title: "Leadership & team building",
                  description: "Demonstrates effective CRM leadership in scenarios.",
                  gradingScale: GradingScale.ONE_TO_FIVE,
                  order: 1,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["CRM-REC"].id }],
                  },
                },
                {
                  title: "Decision making under pressure",
                  gradingScale: GradingScale.ONE_TO_FIVE,
                  order: 2,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["CRM-REC"].id }],
                  },
                },
                {
                  title: "Communication & assertiveness",
                  gradingScale: GradingScale.ONE_TO_FIVE,
                  order: 3,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["CRM-REC"].id }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: { sections: { include: { tasks: true } } },
  });

  const lineTasks = lineForm.sections.flatMap((s) => s.tasks);
  const crmTasks = crmForm.sections.flatMap((s) => s.tasks);

  // —— Evaluations ——
  const completedEval = await prisma.evaluation.create({
    data: {
      formId: lineForm.id,
      traineeId: ines.id,
      evaluatorId: examiner.id,
      scheduledDate: subDays(now, 2),
      location: "LPPT — Line flight",
      status: EvaluationStatus.COMPLETED,
      overallResult: EvaluationResult.PASSED,
      signedAt: subDays(now, 1),
      evaluatorSignature: "J. Silva",
      traineeSignature: "I. Santos",
      notes: "Satisfactory line check — all tasks passed.",
      taskResults: {
        create: lineTasks.map((task) => ({
          taskId: task.id,
          passed: true,
        })),
      },
    },
  });

  await renewQualificationsForEvaluation(completedEval.id, admin.id);

  const inProgressEval = await prisma.evaluation.create({
    data: {
      formId: crmForm.id,
      traineeId: miguel.id,
      evaluatorId: examiner.id,
      scheduledDate: now,
      location: "Training centre LPPR",
      status: EvaluationStatus.IN_PROGRESS,
      taskResults: {
        create: crmTasks.map((task, index) => ({
          taskId: task.id,
          numericGrade: index < 2 ? 4 : null,
        })),
      },
    },
  });

  const assignedEval = await prisma.evaluation.create({
    data: {
      formId: lineForm.id,
      traineeId: pedro.id,
      evaluatorId: examiner.id,
      scheduledDate: addDays(now, 5),
      location: "SIM-2 LPPT",
      status: EvaluationStatus.ASSIGNED,
      taskResults: {
        create: lineTasks.map((task) => ({ taskId: task.id })),
      },
    },
  });

  // —— Manual qualification renew & edit ——
  const pedroOpc = await prisma.userQualification.findFirst({
    where: {
      userId: pedro.id,
      qualificationId: qualByCode["A320-OPC"].id,
    },
    include: { qualification: true },
  });

  if (pedroOpc) {
    const before = toUserQualificationAuditSnapshot(pedroOpc);
    const issuedDate = startOfToday();
    const expiryDate = addDays(issuedDate, pedroOpc.qualification.validityPeriodDays);

    const renewed = await prisma.userQualification.update({
      where: { id: pedroOpc.id },
      data: {
        issuedDate,
        originalExpiryDate: expiryDate,
        expiryDate,
        limitedByQualificationId: null,
        status: QualStatus.VALID,
        linkedEvaluationId: null,
      },
      include: { qualification: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "USER_QUALIFICATION_RENEWED",
        entityType: "UserQualification",
        entityId: renewed.id,
        beforeValue: JSON.stringify(before),
        afterValue: JSON.stringify(
          toUserQualificationAuditSnapshot({
            ...renewed,
            notes: "Manual renewal after OPC prep",
          }),
        ),
      },
    });

    await recomputeAllEffectiveExpiriesForUser(pedro.id);
  }

  const beatrizDg = await prisma.userQualification.findFirst({
    where: {
      userId: beatriz.id,
      qualificationId: qualByCode["DG"].id,
    },
    include: { qualification: true },
  });

  if (beatrizDg) {
    const before = toUserQualificationAuditSnapshot(beatrizDg);
    const issuedDate = subDays(now, 30);
    const expiryDate = addDays(now, 90);

    const updated = await prisma.userQualification.update({
      where: { id: beatrizDg.id },
      data: {
        issuedDate,
        originalExpiryDate: expiryDate,
        expiryDate,
        limitedByQualificationId: null,
        status: QualStatus.VALID,
        issuingAuthority: "IBEX Training",
      },
      include: { qualification: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: "USER_QUALIFICATION_UPDATED",
        entityType: "UserQualification",
        entityId: updated.id,
        beforeValue: JSON.stringify(before),
        afterValue: JSON.stringify(toUserQualificationAuditSnapshot(updated)),
      },
    });

    await recomputeAllEffectiveExpiriesForUser(beatriz.id);
  }

  console.log("Demo activity added:\n");
  console.log("Forms:");
  console.log(`  - ${lineForm.code} v${lineForm.version} (published)`);
  console.log(`  - ${crmForm.code} v${crmForm.version} (published)`);
  console.log("\nEvaluations:");
  console.log(`  - COMPLETED (signed): /evaluations/${completedEval.id}`);
  console.log(`  - IN_PROGRESS:        /evaluations/${inProgressEval.id}`);
  console.log(`  - ASSIGNED:           /evaluations/${assignedEval.id}`);
  console.log("\nQualifications:");
  console.log(`  - Renewed OPC for ${pedro.firstName} ${pedro.lastName}`);
  console.log(`  - Updated DG dates for ${beatriz.firstName} ${beatriz.lastName}`);
  console.log(`  - Auto-renewed via sign-off for ${ines.firstName} ${ines.lastName} (LINE/SEC)`);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
