"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { History, Loader2 } from "lucide-react";
import {
  fetchUserQualificationHistoryAction,
  type UserQualificationHistoryDto,
} from "@/actions/user-qualifications";
import type { PilotQualificationRow } from "@/components/pilots/pilot-qualification-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type UserQualificationHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: PilotQualificationRow | null;
};

export function UserQualificationHistoryDialog({
  open,
  onOpenChange,
  record,
}: UserQualificationHistoryDialogProps) {
  const [history, setHistory] = useState<UserQualificationHistoryDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !record) {
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const entries = await fetchUserQualificationHistoryAction(record.id);
        setHistory(entries);
      } catch {
        setError("Unable to load change history.");
        setHistory([]);
      }
    });
  }, [open, record]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Change history</DialogTitle>
          <DialogDescription>
            {record
              ? `${record.code} — ${record.name}`
              : "Qualification audit trail"}
          </DialogDescription>
        </DialogHeader>

        {pending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading history…
          </div>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {!pending && !error && history.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <History className="size-8 opacity-50" />
            <p>No changes recorded yet for this qualification.</p>
          </div>
        )}

        {!pending && history.length > 0 && (
          <ul className="space-y-4">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="rounded-lg border bg-card p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Badge variant="secondary">{entry.actionLabel}</Badge>
                    <p className="mt-2 font-medium">{entry.actorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.actorEmail}
                    </p>
                  </div>
                  <time
                    dateTime={entry.timestamp}
                    className="text-xs text-muted-foreground"
                  >
                    {format(new Date(entry.timestamp), "dd MMM yyyy HH:mm")}{" "}
                    UTC
                  </time>
                </div>

                {entry.changes.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-muted-foreground">
                    {entry.changes.map((line) => (
                      <li key={line} className="list-inside list-disc">
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-muted-foreground">No field changes logged.</p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
