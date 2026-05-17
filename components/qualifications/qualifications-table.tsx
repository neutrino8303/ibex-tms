"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Shield } from "lucide-react";
import {
  QualificationFormDialog,
  type QualificationCatalogOption,
  type QualificationRow,
} from "@/components/qualifications/qualification-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { qualCategoryLabel } from "@/lib/qual-categories";

type QualificationsTableProps = {
  qualifications: QualificationRow[];
  catalog: QualificationCatalogOption[];
};

export function QualificationsTable({
  qualifications,
  catalog,
}: QualificationsTableProps) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<QualificationRow | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return qualifications;
    return qualifications.filter((item) =>
      [item.code, item.name, item.category, item.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [qualifications, search]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search code, name, category…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New qualification
        </Button>
      </div>

      {qualifications.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No qualifications defined"
          description="Add type ratings, medicals, and recurrent training items."
        >
          <Button onClick={() => setCreateOpen(true)}>
            New qualification
          </Button>
        </EmptyState>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search term."
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.code}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {qualCategoryLabel[item.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.validityPeriodDays} days</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditing(item)}
                      aria-label={`Edit ${item.code}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {createOpen && (
        <QualificationFormDialog
          open
          onOpenChange={setCreateOpen}
          catalog={catalog}
        />
      )}
      {editing && (
        <QualificationFormDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          qualification={editing}
          catalog={catalog}
        />
      )}
    </>
  );
}
