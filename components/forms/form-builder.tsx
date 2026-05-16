"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowLeft, Plus, Save, Send } from "lucide-react";
import { UserRole } from "@prisma/client";
import { publishFormAction, saveFormAction } from "@/actions/forms";
import { initialActionState } from "@/lib/action-state";
import {
  createEmptySection,
  reindexSections,
  type FormDraft,
  type QualificationOption,
} from "@/lib/form-builder";
import { ALL_GRADING_SCALES, gradingScaleLabel } from "@/lib/grading";
import { ALL_USER_ROLES, userRoleLabel } from "@/lib/roles";
import { SortableSection } from "@/components/forms/sortable-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
);

type FormBuilderProps = {
  initialDraft: FormDraft;
  qualifications: QualificationOption[];
  isNew?: boolean;
};

export function FormBuilder({
  initialDraft,
  qualifications,
  isNew = false,
}: FormBuilderProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<FormDraft>(initialDraft);
  const [saveState, saveForm, savePending] = useActionState(
    saveFormAction,
    initialActionState,
  );
  const [publishState, publishForm, publishPending] = useActionState(
    publishFormAction,
    initialActionState,
  );
  const [, startTransition] = useTransition();

  const sectionSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sectionIds = draft.sections.map((section) => section.clientId);

  useEffect(() => {
    if (publishState.success) {
      router.refresh();
    }
  }, [publishState.success, router]);

  function toggleRole(role: UserRole, checked: boolean) {
    setDraft((current) => ({
      ...current,
      applicableRoles: checked
        ? [...current.applicableRoles, role]
        : current.applicableRoles.filter((r) => r !== role),
    }));
  }

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = draft.sections.findIndex(
      (section) => section.clientId === active.id,
    );
    const newIndex = draft.sections.findIndex(
      (section) => section.clientId === over.id,
    );
    if (oldIndex < 0 || newIndex < 0) return;

    setDraft((current) => ({
      ...current,
      sections: reindexSections(
        arrayMove(current.sections, oldIndex, newIndex),
      ),
    }));
  }

  function updateSection(index: number, section: FormDraft["sections"][number]) {
    setDraft((current) => {
      const sections = [...current.sections];
      sections[index] = section;
      return { ...current, sections };
    });
  }

  function removeSection(index: number) {
    setDraft((current) => ({
      ...current,
      sections: reindexSections(
        current.sections.filter((_, i) => i !== index),
      ),
    }));
  }

  function handleSaveSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const payload = form.elements.namedItem("payload") as HTMLInputElement;
    payload.value = JSON.stringify({
      ...draft,
      sections: reindexSections(draft.sections),
    });
  }

  function handlePublish() {
    if (!draft.id) return;
    const formData = new FormData();
    formData.set("formId", draft.id);
    startTransition(() => {
      publishForm(formData);
    });
  }

  const actionError = saveState.error ?? publishState.error;
  const actionMessage = saveState.message ?? publishState.message;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/forms"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to forms
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isNew ? "New evaluation form" : draft.name || "Edit form"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {!isNew && (
              <Badge variant="outline">
                {draft.code} · v{draft.version}
              </Badge>
            )}
            {draft.isPublished ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
                Published
              </Badge>
            ) : (
              <Badge variant="secondary">Draft</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={saveForm} onSubmit={handleSaveSubmit}>
            <input type="hidden" name="payload" defaultValue="" />
            <Button type="submit" disabled={savePending || publishPending}>
              <Save className="size-4" />
              {savePending ? "Saving…" : "Save draft"}
            </Button>
          </form>
          {draft.id && !draft.isPublished && (
            <Button
              type="button"
              disabled={savePending || publishPending}
              onClick={handlePublish}
            >
              <Send className="size-4" />
              {publishPending ? "Publishing…" : "Publish"}
            </Button>
          )}
        </div>
      </div>

      {draft.isPublished && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This version is published. Saving will create version{" "}
          {draft.version + 1} as a new draft.
        </p>
      )}

      {(actionError || actionMessage) && (
        <p
          className={cn(
            "rounded-md px-3 py-2 text-sm",
            actionError
              ? "bg-destructive/10 text-destructive"
              : "bg-emerald-50 text-emerald-800",
          )}
        >
          {actionError ?? actionMessage}
        </p>
      )}

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium">Form details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">Form code</Label>
            <Input
              id="code"
              value={draft.code}
              onChange={(event) =>
                setDraft((c) => ({
                  ...c,
                  code: event.target.value.toUpperCase(),
                }))
              }
              placeholder="OPC-A320"
              disabled={Boolean(draft.id)}
            />
            {!isNew && draft.id && (
              <p className="text-xs text-muted-foreground">
                Code cannot change after creation.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Form name</Label>
            <Input
              id="name"
              value={draft.name}
              onChange={(event) =>
                setDraft((c) => ({ ...c, name: event.target.value }))
              }
              placeholder="OPC – A320"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultGradingScale">Default grading scale</Label>
            <select
              id="defaultGradingScale"
              className={selectClassName}
              value={draft.defaultGradingScale}
              onChange={(event) =>
                setDraft((c) => ({
                  ...c,
                  defaultGradingScale: event.target
                    .value as FormDraft["defaultGradingScale"],
                }))
              }
            >
              {ALL_GRADING_SCALES.map((scale) => (
                <option key={scale} value={scale}>
                  {gradingScaleLabel[scale]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Applicable roles</legend>
          <div className="flex flex-wrap gap-4">
            {ALL_USER_ROLES.map((role) => (
              <label
                key={role}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <Checkbox
                  checked={draft.applicableRoles.includes(role)}
                  onCheckedChange={(checked) =>
                    toggleRole(role, checked === true)
                  }
                />
                {userRoleLabel[role]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Sections & tasks</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setDraft((c) => ({
                ...c,
                sections: reindexSections([
                  ...c.sections,
                  createEmptySection(c.sections.length),
                ]),
              }))
            }
          >
            <Plus className="size-4" />
            Add section
          </Button>
        </div>

        <DndContext
          sensors={sectionSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext
            items={sectionIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {draft.sections.map((section, index) => (
                <SortableSection
                  key={section.clientId}
                  section={section}
                  defaultGradingScale={draft.defaultGradingScale}
                  qualifications={qualifications}
                  onChange={(updated) => updateSection(index, updated)}
                  onRemove={() => removeSection(index)}
                  canRemove={draft.sections.length > 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
