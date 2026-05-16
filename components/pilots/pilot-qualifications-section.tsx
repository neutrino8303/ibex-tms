"use client";

import { useState } from "react";
import { History, Pencil, Plus, RefreshCw, User } from "lucide-react";
import type {
  PilotQualificationRow,
  QualificationOption,
} from "@/components/pilots/pilot-qualification-types";
import { RenewUserQualificationDialog } from "@/components/pilots/renew-user-qualification-dialog";
import { UserQualificationFormDialog } from "@/components/pilots/user-qualification-form-dialog";
import { UserQualificationHistoryDialog } from "@/components/pilots/user-qualification-history-dialog";
import { QualStatusBadge } from "@/components/qual-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export type { PilotQualificationRow, QualificationOption } from "@/components/pilots/pilot-qualification-types";

type PilotQualificationsSectionProps = {
  userId: string;
  pilotName: string;
  canManage: boolean;
  canViewHistory: boolean;
  rows: PilotQualificationRow[];
  catalog: QualificationOption[];
};

export function PilotQualificationsSection({
  userId,
  pilotName,
  canManage,
  canViewHistory,
  rows,
  catalog,
}: PilotQualificationsSectionProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PilotQualificationRow | null>(null);
  const [renewing, setRenewing] = useState<PilotQualificationRow | null>(null);
  const [historyFor, setHistoryFor] = useState<PilotQualificationRow | null>(null);

  const showActions = canManage || canViewHistory;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Qualifications</h2>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Add, edit, or renew qualifications. Open history to see who changed what and when."
              : canViewHistory
                ? "View change history for each qualification record."
                : "Status is computed from expiry date at display time."}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add qualification
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-sm font-medium">No qualifications on record</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {canManage
                ? "Add a qualification from the catalog or renew via evaluation sign-off."
                : "Qualifications appear here after assignment or evaluation sign-off."}
            </p>
            {canManage && (
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus className="size-4" />
                Add qualification
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Qualification</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Days left</TableHead>
                <TableHead>Authority</TableHead>
                <TableHead>Status</TableHead>
                {showActions && <TableHead className="w-[120px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {row.code}
                    </p>
                  </TableCell>
                  <TableCell>
                    {format(row.issuedDate, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(row.expiryDate, "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.daysRemaining < 0
                      ? `${Math.abs(row.daysRemaining)}d overdue`
                      : `${row.daysRemaining}d`}
                  </TableCell>
                  <TableCell>{row.issuingAuthority ?? "—"}</TableCell>
                  <TableCell>
                    <QualStatusBadge status={row.displayStatus} />
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        {canViewHistory && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setHistoryFor(row)}
                            aria-label={`Change history for ${row.name}`}
                          >
                            <History className="size-4" />
                          </Button>
                        )}
                        {canManage && (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setRenewing(row)}
                              aria-label={`Renew ${row.name}`}
                            >
                              <RefreshCw className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setEditing(row)}
                              aria-label={`Edit ${row.name}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {canManage && (
        <>
          <UserQualificationFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            userId={userId}
            pilotName={pilotName}
            catalog={catalog}
          />
          <UserQualificationFormDialog
            open={Boolean(editing)}
            onOpenChange={(open) => {
              if (!open) setEditing(null);
            }}
            userId={userId}
            pilotName={pilotName}
            catalog={catalog}
            record={editing}
          />
          <RenewUserQualificationDialog
            key={renewing?.id ?? "renew-closed"}
            open={Boolean(renewing)}
            onOpenChange={(open) => {
              if (!open) setRenewing(null);
            }}
            userId={userId}
            record={renewing}
          />
        </>
      )}

      {canViewHistory && (
        <UserQualificationHistoryDialog
          open={Boolean(historyFor)}
          onOpenChange={(open) => {
            if (!open) setHistoryFor(null);
          }}
          record={historyFor}
        />
      )}
    </div>
  );
}
