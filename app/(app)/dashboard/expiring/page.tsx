import Link from "next/link";
import { redirect } from "next/navigation";
import { QualCategory } from "@prisma/client";
import { ExpiringFilters } from "@/components/dashboard/expiring-filters";
import { ExpiringQualsTable } from "@/components/dashboard/expiring-quals-table";
import { getCurrentUser, hasAnyRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import {
  canViewOrgDashboard,
  listExpiringQualifications,
  type ExpiringQualFilters,
} from "@/server/dashboard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCESS_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.AUDITOR,
];

type ExpiringPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseFilters(
  params: Record<string, string | string[] | undefined>,
): ExpiringQualFilters {
  const status = readParam(params.status);
  const category = readParam(params.category);
  const base = readParam(params.base);

  return {
    q: readParam(params.q),
    status:
      status === "expiring" ||
      status === "expired" ||
      status === "suspended" ||
      status === "all"
        ? status
        : "all",
    category:
      category && Object.values(QualCategory).includes(category as QualCategory)
        ? (category as QualCategory)
        : "all",
    base: base ?? "all",
  };
}

export default async function ExpiringQualificationsPage({
  searchParams,
}: ExpiringPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!hasAnyRole(user, ACCESS_ROLES) || !canViewOrgDashboard(user)) {
    redirect("/");
  }

  const params = await searchParams;
  const filters = parseFilters(params);
  const { rows, bases, total } = await listExpiringQualifications(
    user,
    filters,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Expiring qualifications
          </h1>
          <p className="text-muted-foreground">
            Fleet-wide view of qualifications expiring within 30 days, already
            expired, or suspended.
          </p>
        </div>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to dashboard
        </Link>
      </div>

      <ExpiringFilters bases={bases} filters={filters} />

      <p className="text-sm text-muted-foreground">
        {total} qualification{total === 1 ? "" : "s"} shown
      </p>

      <ExpiringQualsTable rows={rows} />
    </div>
  );
}
