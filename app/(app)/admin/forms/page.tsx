import { FormsList } from "@/components/forms/forms-list";
import { listFormGroups } from "@/server/forms";

export default async function AdminFormsPage() {
  const groups = await listFormGroups();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Evaluation forms
        </h1>
        <p className="text-muted-foreground">
          Build and version evaluation forms. Published forms link qualifications
          to tasks for automatic renewal on sign-off.
        </p>
      </div>
      <FormsList groups={groups} />
    </div>
  );
}
