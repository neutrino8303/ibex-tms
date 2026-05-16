import { format } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user.firstName}
        </h1>
        <p className="text-muted-foreground">
          Aviation Training Management System — Phase 1 foundation is ready.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your roles</CardTitle>
            <CardDescription>Active role assignments</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Badge key={role} variant="secondary">
                {role.replace(/_/g, " ")}
              </Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today</CardTitle>
            <CardDescription>UTC reference</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {format(new Date(), "dd MMM yyyy")}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "HH:mm")} UTC
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next phases</CardTitle>
            <CardDescription>Planned MVP modules</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            User & qualification admin, form builder, evaluation workflow with
            auto-renewal, and expiring-quals dashboards.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
