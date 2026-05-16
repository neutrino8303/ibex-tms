import Link from "next/link";
import { format } from "date-fns";
import type { EnrichedQualificationRow } from "@/server/dashboard";
import { QualStatusBadge } from "@/components/qual-status-badge";
import { EmptyState } from "@/components/empty-state";
import { qualCategoryLabel } from "@/lib/roles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap } from "lucide-react";

type ExpiringQualsTableProps = {
  rows: EnrichedQualificationRow[];
};

export function ExpiringQualsTable({ rows }: ExpiringQualsTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="No qualifications match"
        description="Try widening your filters or reset to see all at-risk records."
      />
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pilot</TableHead>
            <TableHead>Base</TableHead>
            <TableHead>Qualification</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link
                  href={`/pilots/${row.userId}`}
                  className="font-medium hover:underline"
                >
                  {row.pilotName}
                </Link>
                {row.employeeNumber && (
                  <p className="text-xs text-muted-foreground">
                    {row.employeeNumber}
                  </p>
                )}
              </TableCell>
              <TableCell>{row.pilotBase ?? "—"}</TableCell>
              <TableCell>
                <div className="font-medium">{row.qualificationName}</div>
                <p className="font-mono text-xs text-muted-foreground">
                  {row.qualificationCode}
                </p>
              </TableCell>
              <TableCell>{qualCategoryLabel[row.category]}</TableCell>
              <TableCell>
                {format(row.expiryDate, "dd MMM yyyy")}
              </TableCell>
              <TableCell className="tabular-nums">
                {row.daysRemaining < 0
                  ? `${Math.abs(row.daysRemaining)}d ago`
                  : `${row.daysRemaining}d`}
              </TableCell>
              <TableCell>
                <QualStatusBadge status={row.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
