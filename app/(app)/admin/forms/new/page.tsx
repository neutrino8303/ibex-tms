import { FormBuilder } from "@/components/forms/form-builder";
import { createEmptyFormDraft } from "@/lib/form-builder";
import { prisma } from "@/server/db";

export default async function NewFormPage() {
  const qualifications = await prisma.qualification.findMany({
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  return (
    <FormBuilder
      initialDraft={createEmptyFormDraft()}
      qualifications={qualifications}
      isNew
    />
  );
}
