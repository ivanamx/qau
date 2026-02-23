-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'VALIDATED', 'CHANNELED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "colonia" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportVote" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportStatusHistory" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "from_status" "ReportStatus" NOT NULL,
    "to_status" "ReportStatus" NOT NULL,
    "changed_by_id" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "Report"("category");

-- CreateIndex
CREATE INDEX "Report_created_at_idx" ON "Report"("created_at");

-- CreateIndex
CREATE INDEX "Report_latitude_longitude_idx" ON "Report"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "ReportVote_report_id_idx" ON "ReportVote"("report_id");

-- CreateIndex
CREATE INDEX "ReportVote_user_id_idx" ON "ReportVote"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ReportVote_report_id_user_id_key" ON "ReportVote"("report_id", "user_id");

-- CreateIndex
CREATE INDEX "ReportStatusHistory_report_id_idx" ON "ReportStatusHistory"("report_id");

-- CreateIndex
CREATE INDEX "ReportStatusHistory_created_at_idx" ON "ReportStatusHistory"("created_at");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportVote" ADD CONSTRAINT "ReportVote_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportVote" ADD CONSTRAINT "ReportVote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportStatusHistory" ADD CONSTRAINT "ReportStatusHistory_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportStatusHistory" ADD CONSTRAINT "ReportStatusHistory_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
