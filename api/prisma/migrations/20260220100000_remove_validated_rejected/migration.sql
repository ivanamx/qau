-- Primero actualizar datos: reportes e historial con VALIDATED o REJECTED pasan a PENDING
UPDATE "Report" SET status = 'PENDING' WHERE status IN ('VALIDATED', 'REJECTED');
UPDATE "ReportStatusHistory" SET "from_status" = 'PENDING' WHERE "from_status" IN ('VALIDATED', 'REJECTED');
UPDATE "ReportStatusHistory" SET "to_status" = 'PENDING' WHERE "to_status" IN ('VALIDATED', 'REJECTED');

-- Quitar el default de status en Report para poder cambiar el tipo del enum
ALTER TABLE "Report" ALTER COLUMN status DROP DEFAULT;

-- Recrear el enum sin VALIDATED ni REJECTED (PostgreSQL no permite eliminar valores de un enum directamente)
ALTER TYPE "ReportStatus" RENAME TO "ReportStatus_old";

CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'CHANNELED', 'IN_PROGRESS', 'RESOLVED');

ALTER TABLE "Report" ALTER COLUMN status TYPE "ReportStatus" USING status::text::"ReportStatus";
ALTER TABLE "ReportStatusHistory" ALTER COLUMN "from_status" TYPE "ReportStatus" USING "from_status"::text::"ReportStatus";
ALTER TABLE "ReportStatusHistory" ALTER COLUMN "to_status" TYPE "ReportStatus" USING "to_status"::text::"ReportStatus";

-- Restaurar el default en Report
ALTER TABLE "Report" ALTER COLUMN status SET DEFAULT 'PENDING'::"ReportStatus";

DROP TYPE "ReportStatus_old";
