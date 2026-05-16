"use client";

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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { GradingScale } from "@prisma/client";
import {
  createEmptyTask,
  type FormSectionDraft,
  type FormTaskDraft,
  type QualificationOption,
} from "@/lib/form-builder";
import { SortableTask } from "@/components/forms/sortable-task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SortableSectionProps = {
  section: FormSectionDraft;
  defaultGradingScale: GradingScale;
  qualifications: QualificationOption[];
  onChange: (section: FormSectionDraft) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function SortableSection({
  section,
  defaultGradingScale,
  qualifications,
  onChange,
  onRemove,
  canRemove,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.clientId });

  const taskSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskIds = section.tasks.map((task) => task.clientId);

  function updateTask(index: number, task: FormTaskDraft) {
    const tasks = [...section.tasks];
    tasks[index] = task;
    onChange({ ...section, tasks });
  }

  function removeTask(index: number) {
    onChange({
      ...section,
      tasks: section.tasks.filter((_, i) => i !== index),
    });
  }

  function handleTaskDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = section.tasks.findIndex((t) => t.clientId === active.id);
    const newIndex = section.tasks.findIndex((t) => t.clientId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onChange({
      ...section,
      tasks: arrayMove(section.tasks, oldIndex, newIndex).map((task, index) => ({
        ...task,
        order: index,
      })),
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border-2 border-border/60 bg-muted/20 p-4",
        isDragging && "z-10 opacity-90 shadow-lg",
      )}
    >
      <div className="mb-4 flex items-start gap-2">
        <button
          type="button"
          className="mt-2 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder section"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5" />
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <Label>Section title</Label>
          <Input
            value={section.title}
            onChange={(event) =>
              onChange({ ...section, title: event.target.value })
            }
            placeholder="e.g. Flight phases"
            required
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="mt-7"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Remove section"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <DndContext
        sensors={taskSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleTaskDragEnd}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {section.tasks.map((task, index) => (
              <SortableTask
                key={task.clientId}
                task={task}
                defaultGradingScale={defaultGradingScale}
                qualifications={qualifications}
                onChange={(updated) => updateTask(index, updated)}
                onRemove={() => removeTask(index)}
                canRemove={section.tasks.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() =>
          onChange({
            ...section,
            tasks: [
              ...section.tasks,
              createEmptyTask(section.tasks.length),
            ],
          })
        }
      >
        <Plus className="size-4" />
        Add task
      </Button>
    </div>
  );
}
