import { notFound, redirect } from "next/navigation";
import {
  EvaluationWorkspace,
} from "@/components/evaluations/evaluation-workspace";
import { getCurrentUser } from "@/lib/auth";
import {
  canEditEvaluation,
  canSignOffEvaluation,
  canViewEvaluation,
  loadEvaluationDetail,
  mapEvaluationToWorkspaceData,
} from "@/server/evaluations";

type EvaluationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EvaluationDetailPage({
  params,
}: EvaluationDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const evaluation = await loadEvaluationDetail(id);
  if (!evaluation) {
    notFound();
  }

  if (!canViewEvaluation(user, evaluation)) {
    redirect("/evaluations");
  }

  const workspaceData = mapEvaluationToWorkspaceData(evaluation);
  const canEdit = canEditEvaluation(user, evaluation);
  const canSignOff = canSignOffEvaluation(user, evaluation);

  return (
    <EvaluationWorkspace
      evaluation={workspaceData}
      canEdit={canEdit}
      canSignOff={canSignOff}
      currentUserName={`${user.firstName} ${user.lastName}`}
    />
  );
}
