import {
  EvaluationStatus,
  GradingScale,
  PrismaClient,
  QualCategory,
  QualStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcrypt";
import { addDays, subDays } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.evaluationTaskResult.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.taskQualificationLink.deleteMany();
  await prisma.formTask.deleteMany();
  await prisma.formSection.deleteMany();
  await prisma.evaluationForm.deleteMany();
  await prisma.userQualification.deleteMany();
  await prisma.qualification.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);
  const now = new Date();

  const qualifications = await Promise.all([
    prisma.qualification.create({
      data: {
        code: "A320-TR",
        name: "A320 Type Rating",
        category: QualCategory.TYPE_RATING,
        validityPeriodDays: 365,
        description: "Initial type rating on Airbus A320 family",
      },
    }),
    prisma.qualification.create({
      data: {
        code: "A320-OPC",
        name: "A320 Operator Proficiency Check",
        category: QualCategory.RECURRENT,
        validityPeriodDays: 180,
      },
    }),
    prisma.qualification.create({
      data: {
        code: "A320-LPC",
        name: "A320 Line Proficiency Check",
        category: QualCategory.RECURRENT,
        validityPeriodDays: 180,
      },
    }),
    prisma.qualification.create({
      data: {
        code: "A320-LINE",
        name: "A320 Line Check",
        category: QualCategory.RECURRENT,
        validityPeriodDays: 365,
      },
    }),
    prisma.qualification.create({
      data: {
        code: "CLASS1-MED",
        name: "Class 1 Medical",
        category: QualCategory.MEDICAL,
        validityPeriodDays: 365,
      },
    }),
    prisma.qualification.create({
      data: {
        code: "ATPL",
        name: "ATPL",
        category: QualCategory.LICENSE,
        validityPeriodDays: 1825,
      },
    }),
    prisma.qualification.create({
      data: {
        code: "ELP",
        name: "English Language Proficiency",
        category: QualCategory.ENDORSEMENT,
        validityPeriodDays: 1460,
      },
    }),
    prisma.qualification.create({
      data: {
        code: "CRM-REC",
        name: "CRM Recurrent",
        category: QualCategory.RECURRENT,
        validityPeriodDays: 365,
      },
    }),
    prisma.qualification.create({
      data: {
        code: "DG",
        name: "Dangerous Goods",
        category: QualCategory.RECURRENT,
        validityPeriodDays: 730,
      },
    }),
    prisma.qualification.create({
      data: {
        code: "SEC-AWR",
        name: "Security Awareness",
        category: QualCategory.RECURRENT,
        validityPeriodDays: 365,
      },
    }),
  ]);

  const qualByCode = Object.fromEntries(
    qualifications.map((q) => [q.code, q]),
  ) as Record<string, (typeof qualifications)[number]>;

  await prisma.qualificationConditional.create({
    data: {
      qualificationId: qualByCode["A320-OPC"].id,
      conditionalQualificationId: qualByCode["A320-TR"].id,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "admin@tms.local",
      passwordHash,
      firstName: "Ana",
      lastName: "Ferreira",
      employeeNumber: "ADM-001",
      base: "LPPT",
      hireDate: subDays(now, 2000),
      roles: { create: [{ role: UserRole.ADMIN }] },
    },
  });

  const trainingManager = await prisma.user.create({
    data: {
      email: "training.manager@tms.local",
      passwordHash,
      firstName: "Ricardo",
      lastName: "Mendes",
      employeeNumber: "TM-010",
      base: "LPPT",
      hireDate: subDays(now, 3500),
      roles: { create: [{ role: UserRole.TRAINING_MANAGER }] },
    },
  });

  const examiners = await Promise.all([
    prisma.user.create({
      data: {
        email: "examiner.silva@tms.local",
        passwordHash,
        firstName: "João",
        lastName: "Silva",
        employeeNumber: "EX-201",
        licenseNumber: "PRT.FCL.123456",
        base: "LPPT",
        hireDate: subDays(now, 4200),
        roles: {
          create: [{ role: UserRole.EXAMINER }, { role: UserRole.INSTRUCTOR }],
        },
      },
    }),
    prisma.user.create({
      data: {
        email: "examiner.costa@tms.local",
        passwordHash,
        firstName: "Maria",
        lastName: "Costa",
        employeeNumber: "EX-202",
        licenseNumber: "PRT.FCL.234567",
        base: "LPPR",
        hireDate: subDays(now, 3800),
        roles: { create: [{ role: UserRole.EXAMINER }] },
      },
    }),
  ]);

  const pilotProfiles = [
    {
      email: "pilot.almeida@tms.local",
      firstName: "Pedro",
      lastName: "Almeida",
      employeeNumber: "PLT-301",
      base: "LPPT",
    },
    {
      email: "pilot.santos@tms.local",
      firstName: "Inês",
      lastName: "Santos",
      employeeNumber: "PLT-302",
      base: "LPPT",
    },
    {
      email: "pilot.oliveira@tms.local",
      firstName: "Miguel",
      lastName: "Oliveira",
      employeeNumber: "PLT-303",
      base: "LPPR",
    },
    {
      email: "pilot.ribeiro@tms.local",
      firstName: "Sofia",
      lastName: "Ribeiro",
      employeeNumber: "PLT-304",
      base: "LPPR",
    },
    {
      email: "pilot.martins@tms.local",
      firstName: "Diogo",
      lastName: "Martins",
      employeeNumber: "PLT-305",
      base: "LPPT",
    },
    {
      email: "pilot.carvalho@tms.local",
      firstName: "Beatriz",
      lastName: "Carvalho",
      employeeNumber: "PLT-306",
      base: "LPPT",
    },
  ];

  const pilots = await Promise.all(
    pilotProfiles.map((profile, index) =>
      prisma.user.create({
        data: {
          ...profile,
          passwordHash,
          licenseNumber: `PRT.FCL.${340000 + index}`,
          hireDate: subDays(now, 1500 + index * 120),
          roles: { create: [{ role: UserRole.PILOT }] },
        },
      }),
    ),
  );

  type QualAssignment = {
    code: string;
    expiryOffsetDays: number;
    status?: QualStatus;
    authority?: string;
  };

  const pilotQualPlans: QualAssignment[][] = [
    [
      { code: "A320-OPC", expiryOffsetDays: -14, status: QualStatus.EXPIRED },
      { code: "CLASS1-MED", expiryOffsetDays: 5 },
      { code: "CRM-REC", expiryOffsetDays: 22 },
      { code: "ATPL", expiryOffsetDays: 900 },
    ],
    [
      { code: "A320-LPC", expiryOffsetDays: 3 },
      { code: "A320-LINE", expiryOffsetDays: 18 },
      { code: "ELP", expiryOffsetDays: 45 },
      { code: "DG", expiryOffsetDays: 120 },
    ],
    [
      { code: "A320-OPC", expiryOffsetDays: -45, status: QualStatus.EXPIRED },
      { code: "SEC-AWR", expiryOffsetDays: 12 },
      { code: "CLASS1-MED", expiryOffsetDays: 28 },
    ],
    [
      { code: "A320-TR", expiryOffsetDays: 200 },
      { code: "A320-OPC", expiryOffsetDays: 7 },
      { code: "CRM-REC", expiryOffsetDays: -3, status: QualStatus.EXPIRED },
    ],
    [
      { code: "A320-LPC", expiryOffsetDays: 25 },
      { code: "A320-LINE", expiryOffsetDays: 60 },
      { code: "CLASS1-MED", expiryOffsetDays: 400 },
    ],
    [
      { code: "A320-OPC", expiryOffsetDays: 14 },
      { code: "DG", expiryOffsetDays: 2 },
      { code: "SEC-AWR", expiryOffsetDays: 90 },
      { code: "ELP", expiryOffsetDays: -20, status: QualStatus.EXPIRED },
    ],
  ];

  for (const [pilotIndex, pilot] of pilots.entries()) {
    const plan = pilotQualPlans[pilotIndex] ?? pilotQualPlans[0];
    for (const assignment of plan) {
      const qualification = qualByCode[assignment.code];
      if (!qualification) continue;

      const expiryDate = addDays(now, assignment.expiryOffsetDays);
      const issuedDate = subDays(
        expiryDate,
        qualification.validityPeriodDays,
      );

      await prisma.userQualification.create({
        data: {
          userId: pilot.id,
          qualificationId: qualification.id,
          issuedDate,
          originalExpiryDate: expiryDate,
          expiryDate,
          issuingAuthority: assignment.authority ?? "EASA",
          status: assignment.status ?? QualStatus.VALID,
        },
      });
    }
    const { recomputeAllEffectiveExpiriesForUser } = await import(
      "../server/qualification-expiry"
    );
    await recomputeAllEffectiveExpiriesForUser(pilot.id);
  }

  const opcForm = await prisma.evaluationForm.create({
    data: {
      code: "OPC-A320",
      name: "OPC – A320",
      version: 1,
      isPublished: true,
      publishedAt: now,
      applicableRoles: JSON.stringify([UserRole.PILOT]),
      defaultGradingScale: GradingScale.PASS_FAIL,
      createdById: admin.id,
      sections: {
        create: [
          {
            title: "Preflight & procedures",
            order: 1,
            tasks: {
              create: [
                {
                  title: "Aircraft systems knowledge",
                  description: "Demonstrate knowledge of A320 systems relevant to OPC.",
                  gradingScale: GradingScale.PASS_FAIL,
                  order: 1,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["A320-OPC"].id }],
                  },
                },
                {
                  title: "SOP compliance — normal ops",
                  gradingScale: GradingScale.PASS_FAIL,
                  order: 2,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["A320-OPC"].id }],
                  },
                },
                {
                  title: "Emergency & abnormal procedures",
                  gradingScale: GradingScale.PASS_FAIL,
                  order: 3,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["A320-OPC"].id }],
                  },
                },
              ],
            },
          },
          {
            title: "Flight phases",
            order: 2,
            tasks: {
              create: [
                {
                  title: "Takeoff & initial climb",
                  gradingScale: GradingScale.PASS_FAIL,
                  order: 1,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["A320-LPC"].id }],
                  },
                },
                {
                  title: "Approach & landing",
                  gradingScale: GradingScale.PASS_FAIL,
                  order: 2,
                  qualLinks: {
                    create: [
                      { qualificationId: qualByCode["A320-OPC"].id },
                      { qualificationId: qualByCode["A320-LPC"].id },
                    ],
                  },
                },
                {
                  title: "Crew resource management",
                  gradingScale: GradingScale.ONE_TO_FIVE,
                  order: 3,
                  qualLinks: {
                    create: [{ qualificationId: qualByCode["A320-LPC"].id }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  const opcTasks = await prisma.formTask.findMany({
    where: { section: { formId: opcForm.id } },
  });

  const sampleEvaluation = await prisma.evaluation.create({
    data: {
      formId: opcForm.id,
      traineeId: pilots[0].id,
      evaluatorId: examiners[0].id,
      scheduledDate: addDays(now, 3),
      location: "SIM-1 LPPT",
      status: EvaluationStatus.ASSIGNED,
      taskResults: {
        create: opcTasks.map((task) => ({ taskId: task.id })),
      },
    },
  });

  console.log("Seed complete.");
  console.log(`Admin login: admin@tms.local / password123`);
  console.log(`Training manager: ${trainingManager.email}`);
  console.log(`Examiners: ${examiners.map((e) => e.email).join(", ")}`);
  console.log(`Sample form: ${opcForm.code} v${opcForm.version}`);
  console.log(`Sample evaluation: /evaluations/${sampleEvaluation.id}`);
  console.log(`Pilots seeded: ${pilots.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
