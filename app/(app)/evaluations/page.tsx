import { UserRole } from "@prisma/client";
import { EvaluationsList } from "@/components/evaluations/evaluations-list";
import { getCurrentUser, hasAnyRole } from "@/lib/auth";
import { listEvaluationsForUser } from "@/server/evaluations";
import { redirect } from "next/navigation";

const SCHEDULE_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
];

export default async function EvaluationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const evaluations = await listEvaluationsForUser(user);
  const showCreateLink = hasAnyRole(user, SCHEDULE_ROLES);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Evaluations</h1>
        <p className="text-muted-foreground">
          Scheduled checks, grading, and sign-off with automatic qualification
          renewal.
        </p>
      </div>
      <EvaluationsList
        evaluations={evaluations}
        showCreateLink={showCreateLink}
      />
    </div>
  );
}
