import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  GraduationCap,
  Users,
  XCircle,
} from "lucide-react";
import { QualPreviewTable } from "@/components/dashboard/qual-preview-table";
import { StatCard } from "@/components/dashboard/stat-card";
import { getCurrentUser } from "@/lib/auth";
import {
  canViewOrgDashboard,
  getDashboardQualPreview,
  getDashboardStats,
  isPilotUser,
  showEvaluatorWorkload,
} from "@/server/dashboard";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [stats, preview] = await Promise.all([
    getDashboardStats(user),
    getDashboardQualPreview(user, 5),
  ]);

  const orgView = canViewOrgDashboard(user);
  const profileHref = isPilotUser(user) ? `/pilots/${user.id}` : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-muted-foreground">
          {orgView
            ? "Organization overview — qualifications and evaluations at a glance."
            : "Your training status — qualifications and evaluations."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.pilots !== null && (
          <StatCard
            title="Pilots"
            value={stats.pilots}
            description="Active pilot accounts"
            icon={Users}
            href="/admin/users"
          />
        )}
        <StatCard
          title="Expiring soon"
          value={stats.qualificationsExpiringSoon}
          description="Within 30 days"
          icon={AlertTriangle}
          tone="warning"
          href={orgView ? "/dashboard/expiring?status=expiring" : profileHref}
        />
        <StatCard
          title="Expired"
          value={stats.qualificationsExpired}
          description="Past validity date"
          icon={XCircle}
          tone="danger"
          href={orgView ? "/dashboard/expiring?status=expired" : profileHref}
        />
        <StatCard
          title="Open evaluations"
          value={stats.openEvaluations}
          description="Assigned or in progress"
          icon={ClipboardList}
          href="/evaluations"
        />
      </div>

      {stats.qualificationsSuspended > 0 && (
        <StatCard
          title="Suspended qualifications"
          value={stats.qualificationsSuspended}
          description="Manually suspended records"
          icon={GraduationCap}
          tone="muted"
          href={orgView ? "/dashboard/expiring?status=suspended" : profileHref}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">
                {orgView ? "Priority qualifications" : "Your at-risk qualifications"}
              </CardTitle>
              <CardDescription>
                Soonest expiring or already expired
              </CardDescription>
            </div>
            {orgView ? (
              <Link
                href="/dashboard/expiring"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                View all
              </Link>
            ) : profileHref ? (
              <Link
                href={profileHref}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                My profile
              </Link>
            ) : null}
          </CardHeader>
          <CardContent>
            <QualPreviewTable rows={preview} showPilot={orgView} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/evaluations"
              className={cn(buttonVariants({ variant: "secondary" }), "justify-start")}
            >
              Evaluations
            </Link>
            {orgView && (
              <Link
                href="/dashboard/expiring"
                className={cn(buttonVariants({ variant: "secondary" }), "justify-start")}
              >
                Expiring qualifications
              </Link>
            )}
            {orgView && (
              <Link
                href="/admin/users"
                className={cn(buttonVariants({ variant: "secondary" }), "justify-start")}
              >
                User management
              </Link>
            )}
            {profileHref && (
              <Link
                href={profileHref}
                className={cn(buttonVariants({ variant: "secondary" }), "justify-start")}
              >
                My qualifications
              </Link>
            )}
            {showEvaluatorWorkload(user) && (
              <p className="pt-2 text-sm text-muted-foreground">
                You have {stats.openEvaluations} evaluation
                {stats.openEvaluations === 1 ? "" : "s"} awaiting completion.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {stats.completedEvaluations} completed evaluation
              {stats.completedEvaluations === 1 ? "" : "s"} in scope.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
