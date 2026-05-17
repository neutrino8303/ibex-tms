"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useActionState } from "react";
import { QualStatus } from "@prisma/client";
import { addDays, format } from "date-fns";
import {
  createUserQualificationAction,
  updateUserQualificationAction,
} from "@/actions/user-qualifications";
import { initialActionState } from "@/lib/action-state";
import { qualStatusLabel } from "@/lib/qualifications";
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
import type {
  PilotQualificationRow,
  QualificationOption,
} from "@/components/pilots/pilot-qualification-types";

const selectClassName = cn(
  "flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
);

function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

type UserQualificationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  pilotName: string;
  catalog: QualificationOption[];
  record?: PilotQualificationRow | null;
};

export function UserQualificationFormDialog({
  open,
  onOpenChange,
  userId,
  pilotName,
  catalog,
  record,
}: UserQualificationFormDialogProps) {
  const isEdit = Boolean(record);
  const router = useRouter();
  const [createState, createAction, createPending] = useActionState(
    createUserQualificationAction,
    initialActionState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateUserQualificationAction,
    initialActionState,
  );
  const state = isEdit ? updateState : createState;
  const formAction = isEdit ? updateAction : createAction;
  const pending = isEdit ? updatePending : createPending;

  const availableCatalog = catalog.filter((item) => !item.alreadyAssigned);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, onOpenChange, router]);

  const defaultIssued = record
    ? toDateInputValue(record.issuedDate)
    : toDateInputValue(new Date());
  const defaultExpiry = record
    ? toDateInputValue(record.originalExpiryDate)
    : toDateInputValue(addDays(new Date(), 180));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit qualification" : "Add qualification"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update dates and status for ${record?.name} on ${pilotName}.`
              : `Assign a catalog qualification to ${pilotName}.`}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          {isEdit && record && (
            <input
              type="hidden"
              name="userQualificationId"
              value={record.id}
            />
          )}

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          {isEdit && record ? (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium">{record.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {record.code}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="qualificationId">Qualification</Label>
              <select
                id="qualificationId"
                name="qualificationId"
                className={selectClassName}
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Select qualification…
                </option>
                {availableCatalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} — {item.name} ({item.validityPeriodDays}d validity)
                  </option>
                ))}
              </select>
              {availableCatalog.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  All catalog qualifications are already assigned to this pilot.
                </p>
              )}
              {state.fieldErrors?.qualificationId?.map((message) => (
                <p key={message} className="text-sm text-destructive">
                  {message}
                </p>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issuedDate">Issued date</Label>
              <Input
                id="issuedDate"
                name="issuedDate"
                type="date"
                required
                defaultValue={defaultIssued}
              />
              {state.fieldErrors?.issuedDate?.map((message) => (
                <p key={message} className="text-sm text-destructive">
                  {message}
                </p>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Original expiry date</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                type="date"
                required
                defaultValue={defaultExpiry}
              />
              <p className="text-xs text-muted-foreground">
                Effective expiry may be earlier if a conditional qualification
                expires sooner.
              </p>
              {state.fieldErrors?.expiryDate?.map((message) => (
                <p key={message} className="text-sm text-destructive">
                  {message}
                </p>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="issuingAuthority">Issuing authority</Label>
              <Input
                id="issuingAuthority"
                name="issuingAuthority"
                placeholder="EASA"
                defaultValue={record?.issuingAuthority ?? "EASA"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Stored status</Label>
              <select
                id="status"
                name="status"
                className={selectClassName}
                defaultValue={record?.storedStatus ?? QualStatus.VALID}
              >
                {Object.values(QualStatus).map((status) => (
                  <option key={status} value={status}>
                    {qualStatusLabel[status]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Display uses expiry unless status is Suspended.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || (!isEdit && availableCatalog.length === 0)}
            >
              {pending ? "Saving…" : isEdit ? "Save changes" : "Add qualification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
