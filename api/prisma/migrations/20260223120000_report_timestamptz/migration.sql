-- Report: guardar created_at y updated_at en UTC (timestamptz) para que la hora
-- se muestre correctamente en la zona horaria del usuario (ej. 14:00 en México = 14:00 en la app).
-- Valores existentes se interpretan como UTC para no cambiar lo que ya hay.
ALTER TABLE "Report" ALTER COLUMN created_at TYPE TIMESTAMPTZ(3) USING created_at AT TIME ZONE 'UTC';
ALTER TABLE "Report" ALTER COLUMN updated_at TYPE TIMESTAMPTZ(3) USING updated_at AT TIME ZONE 'UTC';
