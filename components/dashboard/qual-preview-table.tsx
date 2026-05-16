import Link from "next/link";
import { format } from "date-fns";
import type { EnrichedQualificationRow } from "@/server/dashboard";
import { QualStatusBadge } from "@/components/qual-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type QualPreviewTableProps = {
  rows: EnrichedQualificationRow[];
  showPilot?: boolean;
};

export function QualPreviewTable({
  rows,
  showPilot = true,
}: QualPreviewTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No expiring or expired qualifications in scope.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showPilot && <TableHead>Pilot</TableHead>}
          <TableHead>Qualification</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            {showPilot && (
              <TableCell>
                <Link
                  href={`/pilots/${row.userId}`}
                  className="hover:underline"
                >
                  {row.pilotName}
                </Link>
              </TableCell>
            )}
            <TableCell>
              <span className="font-medium">{row.qualificationCode}</span>
              <span className="text-muted-foreground"> — {row.qualificationName}</span>
            </TableCell>
            <TableCell>{format(row.expiryDate, "dd MMM yyyy")}</TableCell>
            <TableCell>
              <QualStatusBadge status={row.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
