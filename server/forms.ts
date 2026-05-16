import { GradingScale, Prisma, UserRole } from "@prisma/client";
import type { FormDraft } from "@/lib/form-builder";
import { writeAuditLog } from "@/server/audit";
import { prisma } from "@/server/db";

const formInclude = {
  sections: {
    orderBy: { order: "asc" as const },
    include: {
      tasks: {
        orderBy: { order: "asc" as const },
        include: { qualLinks: true },
      },
    },
  },
} satisfies Prisma.EvaluationFormInclude;

export async function loadFormDraft(formId: string): Promise<FormDraft | null> {
  const form = await prisma.evaluationForm.findUnique({
    where: { id: formId },
    include: formInclude,
  });

  if (!form) {
    return null;
  }

  return {
    id: form.id,
    code: form.code,
    name: form.name,
    version: form.version,
    isPublished: form.isPublished,
    applicableRoles: JSON.parse(form.applicableRoles) as UserRole[],
    defaultGradingScale: form.defaultGradingScale,
    sections: form.sections.map((section) => ({
      clientId: section.id,
      id: section.id,
      title: section.title,
      order: section.order,
      tasks: section.tasks.map((task) => ({
        clientId: task.id,
        id: task.id,
        title: task.title,
        description: task.description ?? "",
        gradingScale: task.gradingScale,
        isMandatory: task.isMandatory,
        order: task.order,
        qualificationIds: task.qualLinks.map((link) => link.qualificationId),
      })),
    })),
  };
}

export async function cloneFormToNextVersion(
  sourceFormId: string,
  actorId: string,
): Promise<string> {
  const source = await prisma.evaluationForm.findUnique({
    where: { id: sourceFormId },
    include: formInclude,
  });

  if (!source) {
    throw new Error("Form not found");
  }

  const latest = await prisma.evaluationForm.findFirst({
    where: { code: source.code },
    orderBy: { version: "desc" },
  });

  const nextVersion = (latest?.version ?? source.version) + 1;

  const cloned = await prisma.evaluationForm.create({
    data: {
      code: source.code,
      name: source.name,
      version: nextVersion,
      isPublished: false,
      applicableRoles: source.applicableRoles,
      defaultGradingScale: source.defaultGradingScale,
      createdById: actorId,
      sections: {
        create: source.sections.map((section) => ({
          title: section.title,
          order: section.order,
          tasks: {
            create: section.tasks.map((task) => ({
              title: task.title,
              description: task.description,
              gradingScale: task.gradingScale,
              isMandatory: task.isMandatory,
              order: task.order,
              qualLinks: {
                create: task.qualLinks.map((link) => ({
                  qualificationId: link.qualificationId,
                })),
              },
            })),
          },
        })),
      },
    },
  });

  await writeAuditLog({
    actorId,
    action: "FORM_VERSION_CREATED",
    entityType: "EvaluationForm",
    entityId: cloned.id,
    beforeValue: { sourceFormId, sourceVersion: source.version },
    afterValue: { formId: cloned.id, version: nextVersion },
  });

  return cloned.id;
}

export async function persistFormDraft(
  draft: FormDraft,
  actorId: string,
): Promise<{ formId: string; version: number; branched: boolean }> {
  let targetFormId = draft.id;
  let branched = false;

  if (draft.id) {
    const existing = await prisma.evaluationForm.findUnique({
      where: { id: draft.id },
    });
    if (!existing) {
      throw new Error("Form not found");
    }
    if (existing.isPublished) {
      targetFormId = await cloneFormToNextVersion(existing.id, actorId);
      branched = true;
    }
  }

  const formId = await prisma.$transaction(async (tx) => {
    let savedId = targetFormId;

    if (savedId) {
      await tx.evaluationForm.update({
        where: { id: savedId },
        data: {
          code: draft.code.toUpperCase(),
          name: draft.name,
          applicableRoles: JSON.stringify(draft.applicableRoles),
          defaultGradingScale: draft.defaultGradingScale,
        },
      });
      await tx.formSection.deleteMany({ where: { formId: savedId } });
    } else {
      const code = draft.code.toUpperCase();
      const latest = await tx.evaluationForm.findFirst({
        where: { code },
        orderBy: { version: "desc" },
      });
      const version = latest ? latest.version + 1 : 1;

      const created = await tx.evaluationForm.create({
        data: {
          code,
          name: draft.name,
          version,
          isPublished: false,
          applicableRoles: JSON.stringify(draft.applicableRoles),
          defaultGradingScale: draft.defaultGradingScale,
          createdById: actorId,
        },
      });
      savedId = created.id;
    }

    for (const section of draft.sections) {
      const createdSection = await tx.formSection.create({
        data: {
          formId: savedId,
          title: section.title,
          order: section.order,
        },
      });

      for (const task of section.tasks) {
        const createdTask = await tx.formTask.create({
          data: {
            sectionId: createdSection.id,
            title: task.title,
            description: task.description || null,
            gradingScale: task.gradingScale,
            isMandatory: task.isMandatory,
            order: task.order,
          },
        });

        if (task.qualificationIds.length > 0) {
          await tx.taskQualificationLink.createMany({
            data: task.qualificationIds.map((qualificationId) => ({
              taskId: createdTask.id,
              qualificationId,
            })),
          });
        }
      }
    }

    return savedId;
  });

  const saved = await prisma.evaluationForm.findUniqueOrThrow({
    where: { id: formId },
  });

  await writeAuditLog({
    actorId,
    action: branched ? "FORM_DRAFT_BRANCHED" : draft.id ? "FORM_UPDATED" : "FORM_CREATED",
    entityType: "EvaluationForm",
    entityId: formId,
    afterValue: {
      code: saved.code,
      version: saved.version,
      sectionCount: draft.sections.length,
    },
  });

  return { formId, version: saved.version, branched };
}

export async function publishForm(
  formId: string,
  actorId: string,
): Promise<void> {
  const form = await prisma.evaluationForm.findUnique({
    where: { id: formId },
    include: { sections: { include: { tasks: true } } },
  });

  if (!form) {
    throw new Error("Form not found");
  }
  if (form.isPublished) {
    throw new Error("Form is already published");
  }
  if (form.sections.length === 0) {
    throw new Error("Add at least one section before publishing");
  }
  const taskCount = form.sections.reduce(
    (sum, section) => sum + section.tasks.length,
    0,
  );
  if (taskCount === 0) {
    throw new Error("Add at least one task before publishing");
  }

  const before = {
    isPublished: form.isPublished,
    publishedAt: form.publishedAt,
  };

  await prisma.evaluationForm.update({
    where: { id: formId },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId,
    action: "FORM_PUBLISHED",
    entityType: "EvaluationForm",
    entityId: formId,
    beforeValue: before,
    afterValue: { isPublished: true, publishedAt: new Date().toISOString() },
  });
}

export type FormListGroup = {
  code: string;
  name: string;
  latestVersion: number;
  latestFormId: string;
  isLatestPublished: boolean;
  versions: Array<{
    id: string;
    version: number;
    isPublished: boolean;
    publishedAt: Date | null;
    updatedAt: Date;
    sectionCount: number;
    taskCount: number;
  }>;
};

export async function listFormGroups(): Promise<FormListGroup[]> {
  const forms = await prisma.evaluationForm.findMany({
    include: {
      sections: { include: { _count: { select: { tasks: true } } } },
    },
    orderBy: [{ code: "asc" }, { version: "desc" }],
  });

  const grouped = new Map<string, FormListGroup>();

  for (const form of forms) {
    const taskCount = form.sections.reduce(
      (sum, section) => sum + section._count.tasks,
      0,
    );
    const entry = {
      id: form.id,
      version: form.version,
      isPublished: form.isPublished,
      publishedAt: form.publishedAt,
      updatedAt: form.createdAt,
      sectionCount: form.sections.length,
      taskCount,
    };

    const existing = grouped.get(form.code);
    if (!existing) {
      grouped.set(form.code, {
        code: form.code,
        name: form.name,
        latestVersion: form.version,
        latestFormId: form.id,
        isLatestPublished: form.isPublished,
        versions: [entry],
      });
    } else {
      existing.versions.push(entry);
      if (form.version > existing.latestVersion) {
        existing.latestVersion = form.version;
        existing.latestFormId = form.id;
        existing.isLatestPublished = form.isPublished;
        existing.name = form.name;
      }
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.code.localeCompare(b.code),
  );
}
