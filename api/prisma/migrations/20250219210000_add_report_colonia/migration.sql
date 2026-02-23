-- AlterTable
ALTER TABLE "Report" ADD COLUMN "colonia" TEXT;

-- CreateIndex
CREATE INDEX "Report_colonia_idx" ON "Report"("colonia");
