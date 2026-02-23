-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_user_id_fkey";

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "citizen_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT,
    "colonia" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenRefreshToken" (
    "id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitizenRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenReportVote" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "citizen_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitizenReportVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_email_key" ON "Citizen"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_phone_key" ON "Citizen"("phone");

-- CreateIndex
CREATE INDEX "Citizen_email_idx" ON "Citizen"("email");

-- CreateIndex
CREATE INDEX "Citizen_phone_idx" ON "Citizen"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenRefreshToken_token_key" ON "CitizenRefreshToken"("token");

-- CreateIndex
CREATE INDEX "CitizenRefreshToken_citizen_id_idx" ON "CitizenRefreshToken"("citizen_id");

-- CreateIndex
CREATE INDEX "CitizenRefreshToken_token_idx" ON "CitizenRefreshToken"("token");

-- CreateIndex
CREATE INDEX "CitizenRefreshToken_expires_at_idx" ON "CitizenRefreshToken"("expires_at");

-- CreateIndex
CREATE INDEX "CitizenReportVote_report_id_idx" ON "CitizenReportVote"("report_id");

-- CreateIndex
CREATE INDEX "CitizenReportVote_citizen_id_idx" ON "CitizenReportVote"("citizen_id");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenReportVote_report_id_citizen_id_key" ON "CitizenReportVote"("report_id", "citizen_id");

-- CreateIndex
CREATE INDEX "Report_user_id_idx" ON "Report"("user_id");

-- CreateIndex
CREATE INDEX "Report_citizen_id_idx" ON "Report"("citizen_id");

-- AddForeignKey
ALTER TABLE "CitizenRefreshToken" ADD CONSTRAINT "CitizenRefreshToken_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "Citizen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenReportVote" ADD CONSTRAINT "CitizenReportVote_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenReportVote" ADD CONSTRAINT "CitizenReportVote_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "Citizen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
