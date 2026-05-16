import { UsersTable } from "@/components/users/users-table";
import type { UserRow } from "@/components/users/user-form-dialog";
import { prisma } from "@/server/db";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: { roles: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const rows: UserRow[] = users.map((user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    employeeNumber: user.employeeNumber,
    licenseNumber: user.licenseNumber,
    base: user.base,
    roles: user.roles.map((assignment) => assignment.role),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage accounts, bases, and role assignments across the organization.
        </p>
      </div>
      <UsersTable users={rows} />
    </div>
  );
}
