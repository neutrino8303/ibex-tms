"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useActionState } from "react";
import { QualCategory } from "@prisma/client";
import {
  createQualificationAction,
  updateQualificationAction,
} from "@/actions/qualifications";
import { initialActionState } from "@/lib/action-state";
import { ALL_QUAL_CATEGORIES, qualCategoryLabel } from "@/lib/qual-categories";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type QualificationRow = {
  id: string;
  code: string;
  name: string;
  category: QualCategory;
  validityPeriodDays: number;
  description: string | null;
  conditionalQualificationIds: string[];
};

export type QualificationCatalogOption = {
  id: string;
  code: string;
  name: string;
};

type QualificationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  qualification?: QualificationRow | null;
  catalog: QualificationCatalogOption[];
};

const selectClassName = cn(
  "flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
);

export function QualificationFormDialog({
  open,
  onOpenChange,
  qualification,
  catalog,
}: QualificationFormDialogProps) {
  const isEdit = Boolean(qualification);
  const action = isEdit ? updateQualificationAction : createQualificationAction;
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, onOpenChange, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit qualification" : "New qualification"}
          </DialogTitle>
          <DialogDescription>
            Define the catalog entry, validity period, and optional conditional
            qualifications that can shorten effective expiry for pilots.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {isEdit && qualification && (
            <input
              type="hidden"
              name="qualificationId"
              value={qualification.id}
            />
          )}
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                name="code"
                placeholder="A320-OPC"
                defaultValue={qualification?.code}
                className="uppercase"
                required
              />
              {state.fieldErrors?.code?.map((message) => (
                <p key={message} className="text-sm text-destructive">
                  {message}
                </p>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                defaultValue={qualification?.category ?? QualCategory.RECURRENT}
                className={selectClassName}
                required
              >
                {ALL_QUAL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {qualCategoryLabel[category]}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.category?.map((message) => (
                <p key={message} className="text-sm text-destructive">
                  {message}
                </p>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={qualification?.name}
              required
            />
            {state.fieldErrors?.name?.map((message) => (
              <p key={message} className="text-sm text-destructive">
                {message}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="validityPeriodDays">Validity (days)</Label>
            <Input
              id="validityPeriodDays"
              name="validityPeriodDays"
              type="number"
              min={1}
              defaultValue={qualification?.validityPeriodDays ?? 180}
              required
            />
            {state.fieldErrors?.validityPeriodDays?.map((message) => (
              <p key={message} className="text-sm text-destructive">
                {message}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              defaultValue={qualification?.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Conditional qualifications (optional)</Label>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
              {catalog.filter((item) => item.id !== qualification?.id).length ===
              0 ? (
                <p className="text-sm text-muted-foreground">
                  No other qualifications in the catalog yet.
                </p>
              ) : (
                catalog
                  .filter((item) => item.id !== qualification?.id)
                  .map((item) => {
                    const checked =
                      qualification?.conditionalQualificationIds.includes(
                        item.id,
                      );
                    return (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="conditionalQualificationIds"
                          value={item.id}
                          defaultChecked={checked}
                          className="mt-0.5 size-4 rounded border-input"
                        />
                        <span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {item.code}
                          </span>
                          <span className="ml-1.5">{item.name}</span>
                        </span>
                      </label>
                    );
                  })
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              If any selected qualification expires earlier for a pilot, this
              qualification&apos;s effective expiry uses the earliest date.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create qualification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
