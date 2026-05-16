"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UserRole } from "@prisma/client";
import { Pencil, Search, UserPlus, Users } from "lucide-react";
import { UserFormDialog, type UserRow } from "@/components/users/user-form-dialog";
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
import { userRoleLabel } from "@/lib/roles";

type UsersTableProps = {
  users: UserRow[];
};

function matchesSearch(user: UserRow, query: string): boolean {
  const haystack = [
    user.firstName,
    user.lastName,
    user.email,
    user.employeeNumber ?? "",
    user.base ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function UsersTable({ users }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => matchesSearch(user, query));
  }, [search, users]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, employee #, base…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="size-4" />
          New user
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users yet"
          description="Create the first training account to get started."
        >
          <Button onClick={() => setCreateOpen(true)}>New user</Button>
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Employee #</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const isPilot = user.roles.includes(UserRole.PILOT);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {isPilot ? (
                        <Link
                          href={`/pilots/${user.id}`}
                          className="text-primary hover:underline"
                        >
                          {user.firstName} {user.lastName}
                        </Link>
                      ) : (
                        <>
                          {user.firstName} {user.lastName}
                        </>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.base ?? "—"}</TableCell>
                    <TableCell>{user.employeeNumber ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role} variant="secondary">
                            {userRoleLabel[role]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingUser(user)}
                        aria-label={`Edit ${user.firstName} ${user.lastName}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {createOpen && (
        <UserFormDialog open onOpenChange={setCreateOpen} />
      )}
      {editingUser && (
        <UserFormDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditingUser(null);
          }}
          user={editingUser}
        />
      )}
    </>
  );
}
