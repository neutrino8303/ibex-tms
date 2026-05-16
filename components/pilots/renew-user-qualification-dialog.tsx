"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useTransition } from "react";
import { useActionState } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { renewUserQualificationAction } from "@/actions/user-qualifications";
import { initialActionState } from "@/lib/action-state";
import type { PilotQualificationRow } from "@/components/pilots/pilot-qualification-types";
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
import { Textarea } from "@/components/ui/textarea";

type RenewUserQualificationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  record: PilotQualificationRow | null;
};

function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function RenewUserQualificationDialog({
  open,
  onOpenChange,
  userId,
  record,
}: RenewUserQualificationDialogProps) {
  const router = useRouter();
  const [, startRefresh] = useTransition();
  const [state, formAction, pending] = useActionState(
    renewUserQualificationAction,
    initialActionState,
  );

  const defaultIssued = toDateInputValue(new Date());
  const previewExpiry = useMemo(() => {
    if (!record) return null;
    return addDays(startOfDay(new Date()), record.validityPeriodDays);
  }, [record]);

  useEffect(() => {
    if (!open || !state.success) {
      return;
    }
    onOpenChange(false);
    startRefresh(() => {
      router.refresh();
    });
  }, [state.success, open, onOpenChange, router, startRefresh]);

  if (!record) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renew qualification</DialogTitle>
          <DialogDescription>
            Sets a new validity period from the catalog ({record.validityPeriodDays}{" "}
            days) and marks the qualification valid.
          </DialogDescription>
        </DialogHeader>
        <form
          key={record.id}
          action={formAction}
          className="space-y-4"
        >
          <input type="hidden" name="userId" value={userId} />
          <input
            type="hidden"
            name="userQualificationId"
            value={record.id}
          />

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <p className="font-medium">{record.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {record.code}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Current expiry: {format(record.expiryDate, "dd MMM yyyy")}
            </p>
            {previewExpiry && (
              <p className="text-xs text-muted-foreground">
                New expiry (if issued today):{" "}
                {format(previewExpiry, "dd MMM yyyy")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="renew-issuedDate">New issued date</Label>
            <Input
              id="renew-issuedDate"
              name="issuedDate"
              type="date"
              defaultValue={defaultIssued}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renew-notes">Notes (optional)</Label>
            <Textarea
              id="renew-notes"
              name="notes"
              rows={2}
              placeholder="e.g. Manual renewal after line check"
            />
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
              {pending ? "Renewing…" : "Renew qualification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
