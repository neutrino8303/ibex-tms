-- AlterTable
ALTER TABLE "Qualification" ADD COLUMN "conditionalQualificationId" TEXT;

-- AlterTable
ALTER TABLE "UserQualification" ADD COLUMN "originalExpiryDate" TIMESTAMP(3);
ALTER TABLE "UserQualification" ADD COLUMN "limitedByQualificationId" TEXT;

-- Backfill original expiry from current effective expiry
UPDATE "UserQualification" SET "originalExpiryDate" = "expiryDate" WHERE "originalExpiryDate" IS NULL;
ALTER TABLE "UserQualification" ALTER COLUMN "originalExpiryDate" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Qualification" ADD CONSTRAINT "Qualification_conditionalQualificationId_fkey" FOREIGN KEY ("conditionalQualificationId") REFERENCES "Qualification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQualification" ADD CONSTRAINT "UserQualification_limitedByQualificationId_fkey" FOREIGN KEY ("limitedByQualificationId") REFERENCES "Qualification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
