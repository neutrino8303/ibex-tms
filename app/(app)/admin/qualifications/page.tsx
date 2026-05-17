import { QualificationsTable } from "@/components/qualifications/qualifications-table";
import { loadQualificationCatalog } from "@/server/qualification-catalog";

export default async function AdminQualificationsPage() {
  const { rows, catalog } = await loadQualificationCatalog();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Qualifications</h1>
        <p className="text-muted-foreground">
          Catalog of licensable and recurrent training items linked to
          evaluation tasks.
        </p>
      </div>
      <QualificationsTable qualifications={rows} catalog={catalog} />
    </div>
  );
}
