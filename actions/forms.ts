"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GradingScale, UserRole } from "@prisma/client";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import type { FormDraft } from "@/lib/form-builder";
import { persistFormDraft, publishForm } from "@/server/forms";
import { requireAdminActorId } from "@/server/require-admin";

const roleEnum = z.nativeEnum(UserRole);
const gradingEnum = z.nativeEnum(GradingScale);

const taskSchema = z.object({
  clientId: z.string(),
  id: z.string().optional(),
  title: z.string().min(1, "Task title is required"),
  description: z.string(),
  gradingScale: gradingEnum,
  isMandatory: z.boolean(),
  order: z.number().int().min(0),
  qualificationIds: z.array(z.string()),
});

const sectionSchema = z.object({
  clientId: z.string(),
  id: z.string().optional(),
  title: z.string().min(1, "Section title is required"),
  order: z.number().int().min(0),
  tasks: z.array(taskSchema).min(1, "Each section needs at least one task"),
});

const formDraftSchema = z.object({
  id: z.string().optional(),
  code: z
    .string()
    .min(2, "Code is required")
    .max(32)
    .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens"),
  name: z.string().min(2, "Name is required"),
  version: z.number().int().min(1),
  isPublished: z.boolean(),
  applicableRoles: z.array(roleEnum).min(1, "Select at least one applicable role"),
  defaultGradingScale: gradingEnum,
  sections: z.array(sectionSchema).min(1, "Add at least one section"),
});

function parseDraft(formData: FormData) {
  const raw = formData.get("payload");
  if (!raw || typeof raw !== "string") {
    return formDraftSchema.safeParse(null);
  }

  try {
    const json: unknown = JSON.parse(raw);
    return formDraftSchema.safeParse(json);
  } catch {
    return formDraftSchema.safeParse(null);
  }
}

export async function saveFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actorId = await requireAdminActorId();
  const parsed = parseDraft(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const result = await persistFormDraft(parsed.data, actorId);
    revalidatePath("/admin/forms");
    revalidatePath(`/admin/forms/${result.formId}/edit`);

    if (!parsed.data.id || result.branched) {
      redirect(`/admin/forms/${result.formId}/edit?saved=1`);
    }

    return {
      success: true,
      message: result.branched
        ? `Saved as version ${result.version} (new draft)`
        : "Draft saved",
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to save form",
    };
  }
}

export async function publishFormAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actorId = await requireAdminActorId();
  const formId = formData.get("formId")?.toString();

  if (!formId) {
    return { error: "Form ID is required" };
  }

  try {
    await publishForm(formId, actorId);
    revalidatePath("/admin/forms");
    revalidatePath(`/admin/forms/${formId}/edit`);
    return { success: true, message: "Form published" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to publish form",
    };
  }
}
