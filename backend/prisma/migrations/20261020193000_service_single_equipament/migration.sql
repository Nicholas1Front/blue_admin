-- Each service now references exactly one equipment.
-- Preserve existing links when possible and fail safely if the old many-to-many
-- data cannot be represented without losing information.

ALTER TABLE "services"
ADD COLUMN "equipament_id" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT "service_id"
    FROM "services_equipaments"
    GROUP BY "service_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot migrate services: at least one service is linked to multiple equipment records.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "services" AS s
    LEFT JOIN "services_equipaments" AS se ON se."service_id" = s."id"
    WHERE se."equipament_id" IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot migrate services: at least one existing service has no linked equipment.';
  END IF;
END $$;

UPDATE "services" AS s
SET "equipament_id" = se."equipament_id"
FROM "services_equipaments" AS se
WHERE se."service_id" = s."id";

ALTER TABLE "services"
ALTER COLUMN "equipament_id" SET NOT NULL;

CREATE INDEX "services_equipament_id_idx" ON "services"("equipament_id");

ALTER TABLE "services"
ADD CONSTRAINT "services_equipament_id_fkey"
FOREIGN KEY ("equipament_id") REFERENCES "equipaments"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE "services_equipaments";
