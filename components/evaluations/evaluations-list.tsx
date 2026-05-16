"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ClipboardList } from "lucide-react";
import type { EvaluationListItem } from "@/server/evaluations";
import { EvaluationStatusBadge } from "@/components/evaluations/evaluation-status-badge";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EvaluationsListProps = {
  evaluations: EvaluationListItem[];
  showCreateLink?: boolean;
};

export function EvaluationsList({
  evaluations,
  showCreateLink = false,
}: EvaluationsListProps) {
  if (evaluations.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No evaluations"
        description="Scheduled checks and sign-offs will appear here."
      >
        {showCreateLink && (
          <Link
            href="/admin/evaluations/new"
            className={cn(buttonVariants())}
          >
            Schedule evaluation
          </Link>
        )}
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      {showCreateLink && (
        <div className="flex justify-end">
          <Link
            href="/admin/evaluations/new"
            className={cn(buttonVariants())}
          >
            Schedule evaluation
          </Link>
        </div>
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form</TableHead>
              <TableHead>Trainee</TableHead>
              <TableHead>Evaluator</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluations.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">
                    {item.formName}
                    <span className="ml-1 font-mono text-xs text-muted-foreground">
                      {item.formCode} v{item.formVersion}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{item.traineeName}</TableCell>
                <TableCell>{item.evaluatorName}</TableCell>
                <TableCell>
                  {format(item.scheduledDate, "dd MMM yyyy")}
                </TableCell>
                <TableCell>{item.location ?? "—"}</TableCell>
                <TableCell>
                  <EvaluationStatusBadge
                    status={item.status}
                    result={
                      item.overallResult as
                        | "PASSED"
                        | "FAILED"
                        | "PARTIAL"
                        | null
                    }
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/evaluations/${item.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
