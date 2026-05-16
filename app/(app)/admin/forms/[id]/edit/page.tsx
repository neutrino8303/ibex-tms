import { notFound } from "next/navigation";
import { FormBuilder } from "@/components/forms/form-builder";
import { loadFormDraft } from "@/server/forms";
import { prisma } from "@/server/db";

type EditFormPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function EditFormPage({
  params,
  searchParams,
}: EditFormPageProps) {
  const { id } = await params;
  await searchParams;

  const [draft, qualifications] = await Promise.all([
    loadFormDraft(id),
    prisma.qualification.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  if (!draft) {
    notFound();
  }

  return (
    <FormBuilder
      key={draft.id}
      initialDraft={draft}
      qualifications={qualifications}
    />
  );
}
