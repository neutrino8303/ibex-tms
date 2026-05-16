"use client";

import Link from "next/link";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";
import type { FormListGroup } from "@/server/forms";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
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

type FormsListProps = {
  groups: FormListGroup[];
};

export function FormsList({ groups }: FormsListProps) {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No evaluation forms yet"
        description="Create your first form to assign OPC, line checks, and other evaluations."
      >
        <Link href="/admin/forms/new" className={cn(buttonVariants())}>
          <Plus className="size-4" />
          New form
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Link href="/admin/forms/new" className={cn(buttonVariants())}>
          <Plus className="size-4" />
          New form
        </Link>
      </div>

      {groups.map((group) => (
        <div key={group.code} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">
              <span className="font-mono text-primary">{group.code}</span>
              {" — "}
              {group.name}
            </h2>
            <Badge variant="outline">Latest v{group.latestVersion}</Badge>
            {group.isLatestPublished ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
                Published
              </Badge>
            ) : (
              <Badge variant="secondary">Draft</Badge>
            )}
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.versions.map((version) => {
                  const isLatest = version.id === group.latestFormId;
                  return (
                    <TableRow
                      key={version.id}
                      className={isLatest ? "bg-muted/30" : undefined}
                    >
                      <TableCell className="font-medium">
                        v{version.version}
                        {isLatest && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (latest)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {version.isPublished ? (
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
                      <TableCell>{version.sectionCount}</TableCell>
                      <TableCell>{version.taskCount}</TableCell>
                      <TableCell>
                        {version.publishedAt
                          ? format(version.publishedAt, "dd MMM yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/forms/${version.id}/edit`}
                          className="text-sm text-primary hover:underline"
                        >
                          Edit
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}
