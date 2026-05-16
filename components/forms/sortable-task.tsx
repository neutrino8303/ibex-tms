"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { GradingScale } from "@prisma/client";
import type { FormTaskDraft, QualificationOption } from "@/lib/form-builder";
import { ALL_GRADING_SCALES, gradingScaleLabel } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
);

type SortableTaskProps = {
  task: FormTaskDraft;
  defaultGradingScale: GradingScale;
  qualifications: QualificationOption[];
  onChange: (task: FormTaskDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function SortableTask({
  task,
  defaultGradingScale,
  qualifications,
  onChange,
  onRemove,
  canRemove,
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.clientId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function toggleQualification(qualificationId: string, checked: boolean) {
    const ids = checked
      ? [...task.qualificationIds, qualificationId]
      : task.qualificationIds.filter((id) => id !== qualificationId);
    onChange({ ...task, qualificationIds: ids });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card p-4",
        isDragging && "z-10 opacity-90 shadow-md",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder task"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Task title</Label>
              <Input
                value={task.title}
                onChange={(event) =>
                  onChange({ ...task, title: event.target.value })
                }
                placeholder="e.g. Approach & landing"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={task.description}
                onChange={(event) =>
                  onChange({ ...task, description: event.target.value })
                }
                rows={2}
                placeholder="Brief task guidance for the examiner"
              />
            </div>
            <div className="space-y-2">
              <Label>Grading scale</Label>
              <select
                className={selectClassName}
                value={task.gradingScale}
                onChange={(event) =>
                  onChange({
                    ...task,
                    gradingScale: event.target.value as GradingScale,
                  })
                }
              >
                {ALL_GRADING_SCALES.map((scale) => (
                  <option key={scale} value={scale}>
                    {gradingScaleLabel[scale]}
                    {scale === defaultGradingScale ? " (form default)" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch
                checked={task.isMandatory}
                onCheckedChange={(checked) =>
                  onChange({ ...task, isMandatory: checked === true })
                }
              />
              <Label className="mb-0">Mandatory</Label>
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">
              Qualifications renewed when passed
            </legend>
            <div className="max-h-32 space-y-2 overflow-y-auto rounded-md border p-2">
              {qualifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No qualifications in catalog yet.
                </p>
              ) : (
                qualifications.map((qual) => (
                  <label
                    key={qual.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={task.qualificationIds.includes(qual.id)}
                      onCheckedChange={(checked) =>
                        toggleQualification(qual.id, checked === true)
                      }
                    />
                    <span>
                      <span className="font-mono text-xs">{qual.code}</span>
                      {" — "}
                      {qual.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          </fieldset>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Remove task"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
