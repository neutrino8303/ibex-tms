import type {
  QualificationCatalogOption,
  QualificationRow,
} from "@/components/qualifications/qualification-form-dialog";
import { prisma } from "@/server/db";
import { fetchConditionalIdsByQualificationId } from "@/server/qualification-conditionals";

export async function loadQualificationCatalog(): Promise<{
  rows: QualificationRow[];
  catalog: QualificationCatalogOption[];
}> {
  const qualifications = await prisma.qualification.findMany({
    orderBy: [{ category: "asc" }, { code: "asc" }],
  });

  const conditionalIdsByQualificationId =
    await fetchConditionalIdsByQualificationId(
      qualifications.map((item) => item.id),
    );

  const catalog: QualificationCatalogOption[] = qualifications.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
  }));

  const rows: QualificationRow[] = qualifications.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    category: item.category,
    validityPeriodDays: item.validityPeriodDays,
    description: item.description,
    conditionalQualificationIds:
      conditionalIdsByQualificationId.get(item.id) ?? [],
  }));

  return { rows, catalog };
}
