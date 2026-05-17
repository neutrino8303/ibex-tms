"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { History, Loader2 } from "lucide-react";
import {
  fetchUserQualificationDetailAction,
  type UserQualificationDetailDto,
} from "@/actions/user-qualifications";
import type { PilotQualificationRow } from "@/components/pilots/pilot-qualification-types";
import { QualStatusBadge } from "@/components/qual-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  expiryReducedTooltip,
  isExpiryReduced,
} from "@/lib/qualification-expiry";
import type { QualStatus } from "@prisma/client";

type UserQualificationDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: PilotQualificationRow | null;
};

function formatDate(iso: string): string {
  return format(new Date(iso), "dd MMM yyyy");
}

function DetailField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function UserQualificationDetailDialog({
  open,
  onOpenChange,
  record,
}: UserQualificationDetailDialogProps) {
  const [detail, setDetail] = useState<UserQualificationDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !record) {
      setDetail(null);
      setError(null);
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const data = await fetchUserQualificationDetailAction(record.id);
        if (!data) {
          setError("Qualification record not found.");
          setDetail(null);
          return;
        }
        setDetail(data);
      } catch {
        setError("Unable to load qualification details.");
        setDetail(null);
      }
    });
  }, [open, record]);

  const expiryReduced =
    detail &&
    detail.expiryReducedByName &&
    isExpiryReduced(
      new Date(detail.originalExpiryDate),
      new Date(detail.expiryDate),
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {record ? record.name : "Qualification details"}
          </DialogTitle>
          <DialogDescription>
            {record ? (
              <span className="font-mono">{record.code}</span>
            ) : (
              "Pilot qualification record"
            )}
          </DialogDescription>
        </DialogHeader>

        {pending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading details…
          </div>
        )}

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {detail && !pending && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <QualStatusBadge status={detail.displayStatus as QualStatus} />
              <span className="text-sm text-muted-foreground">
                {detail.daysRemaining < 0
                  ? `${Math.abs(detail.daysRemaining)} days overdue`
                  : `${detail.daysRemaining} days remaining`}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField
                label="Initial acquisition"
                value={formatDate(detail.initialAcquisitionDate)}
                hint="First recorded on this pilot's file"
              />
              <DetailField
                label="Last renewal"
                value={
                  detail.lastRenewalDate
                    ? formatDate(detail.lastRenewalDate)
                    : "—"
                }
                hint="Most recent manual or evaluation sign-off renewal"
              />
              <DetailField
                label="Current issued date"
                value={formatDate(detail.issuedDate)}
              />
              <DetailField
                label="Issuing authority"
                value={detail.issuingAuthority ?? "—"}
              />
              <DetailField
                label="Original expiry"
                value={formatDate(detail.originalExpiryDate)}
                hint="From validity period or manual entry"
              />
              <DetailField
                label="Effective expiry"
                value={formatDate(detail.expiryDate)}
                hint={
                  expiryReduced
                    ? expiryReducedTooltip(detail.expiryReducedByName!)
                    : undefined
                }
              />
              <DetailField
                label="Validity period"
                value={`${detail.validityPeriodDays} days`}
              />
              <DetailField
                label="Stored status"
                value={detail.storedStatus.replaceAll("_", " ")}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Catalog conditionals
              </p>
              <p className="text-xs text-muted-foreground">
                Other qualifications that can shorten effective expiry when
                they expire sooner for this pilot.
              </p>
              {detail.conditionals.length === 0 ? (
                <p className="text-sm text-muted-foreground">None configured.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.conditionals.map((conditional) => (
                    <li
                      key={conditional.id}
                      className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {conditional.code}
                      </span>
                      <span>{conditional.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Change log
              </p>
              {detail.history.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
                  <History className="size-8 opacity-50" />
                  <p>No changes recorded yet.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {detail.history.map((entry) => (
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
                        <p className="mt-3 text-muted-foreground">
                          No field changes logged.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
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
