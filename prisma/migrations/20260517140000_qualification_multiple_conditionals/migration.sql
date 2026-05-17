-- CreateTable
CREATE TABLE "QualificationConditional" (
    "id" TEXT NOT NULL,
    "qualificationId" TEXT NOT NULL,
    "conditionalQualificationId" TEXT NOT NULL,

    CONSTRAINT "QualificationConditional_pkey" PRIMARY KEY ("id")
);

-- Migrate existing single conditional links
INSERT INTO "QualificationConditional" ("id", "qualificationId", "conditionalQualificationId")
SELECT
    'qc_' || "id",
    "id",
    "conditionalQualificationId"
FROM "Qualification"
WHERE "conditionalQualificationId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Qualification" DROP CONSTRAINT IF EXISTS "Qualification_conditionalQualificationId_fkey";

-- AlterTable
ALTER TABLE "Qualification" DROP COLUMN "conditionalQualificationId";

-- CreateIndex
CREATE UNIQUE INDEX "QualificationConditional_qualificationId_conditionalQualificationId_key" ON "QualificationConditional"("qualificationId", "conditionalQualificationId");

-- CreateIndex
CREATE INDEX "QualificationConditional_conditionalQualificationId_idx" ON "QualificationConditional"("conditionalQualificationId");

-- AddForeignKey
ALTER TABLE "QualificationConditional" ADD CONSTRAINT "QualificationConditional_qualificationId_fkey" FOREIGN KEY ("qualificationId") REFERENCES "Qualification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualificationConditional" ADD CONSTRAINT "QualificationConditional_conditionalQualificationId_fkey" FOREIGN KEY ("conditionalQualificationId") REFERENCES "Qualification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
