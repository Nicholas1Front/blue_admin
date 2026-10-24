-- Keep stored tithe states aligned with the Services business rules.
UPDATE "services"
SET "tithe_status" = 'aguardando'
WHERE "tithe_status" = 'pending';

UPDATE "services"
SET "tithe_status" = 'concluído'
WHERE "tithe_status" = 'paid';

ALTER TABLE "services"
ALTER COLUMN "tithe_status" SET DEFAULT 'aguardando';
