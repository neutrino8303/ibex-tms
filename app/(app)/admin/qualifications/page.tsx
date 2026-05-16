import { QualificationsTable } from "@/components/qualifications/qualifications-table";
import type { QualificationRow } from "@/components/qualifications/qualification-form-dialog";
import { prisma } from "@/server/db";

export default async function AdminQualificationsPage() {
  const qualifications = await prisma.qualification.findMany({
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });

  const rows: QualificationRow[] = qualifications.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    category: item.category,
    validityPeriodDays: item.validityPeriodDays,
    description: item.description,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Qualifications</h1>
        <p className="text-muted-foreground">
          Catalog of licensable and recurrent training items linked to
          evaluation tasks.
        </p>
      </div>
      <QualificationsTable qualifications={rows} />
    </div>
  );
}
