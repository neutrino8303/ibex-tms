import { UserRole } from "@prisma/client";
import { CreateEvaluationForm } from "@/components/evaluations/create-evaluation-form";
import { prisma } from "@/server/db";

export default async function NewEvaluationPage() {
  const [forms, pilots, evaluators] = await Promise.all([
    prisma.evaluationForm.findMany({
      where: { isPublished: true },
      orderBy: [{ code: "asc" }, { version: "desc" }],
    }),
    prisma.user.findMany({
      where: { roles: { some: { role: UserRole.PILOT } } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { in: [UserRole.EXAMINER, UserRole.INSTRUCTOR] },
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const latestFormsByCode = new Map<string, (typeof forms)[number]>();
  for (const form of forms) {
    if (!latestFormsByCode.has(form.code)) {
      latestFormsByCode.set(form.code, form);
    }
  }

  const formOptions = [...latestFormsByCode.values()].map((form) => ({
    id: form.id,
    label: `${form.code} — ${form.name} (v${form.version})`,
  }));

  const pilotOptions = pilots.map((pilot) => ({
    id: pilot.id,
    label: `${pilot.firstName} ${pilot.lastName} (${pilot.employeeNumber ?? pilot.email})`,
  }));

  const evaluatorOptions = evaluators.map((evaluator) => ({
    id: evaluator.id,
    label: `${evaluator.firstName} ${evaluator.lastName}`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Schedule evaluation
        </h1>
        <p className="text-muted-foreground">
          Assign a published form to a pilot and examiner or instructor.
        </p>
      </div>
      <CreateEvaluationForm
        forms={formOptions}
        pilots={pilotOptions}
        evaluators={evaluatorOptions}
      />
    </div>
  );
}
