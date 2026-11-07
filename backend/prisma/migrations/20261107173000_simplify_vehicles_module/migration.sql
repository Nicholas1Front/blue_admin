-- Preserve the existing vehicle data while simplifying the vehicle model.
ALTER TABLE "vehicles"
ADD COLUMN "title" TEXT,
ADD COLUMN "crlv" TEXT,
ADD COLUMN "crv" TEXT,
ADD COLUMN "observations" TEXT;

UPDATE "vehicles"
SET
    "title" = concat_ws(' ', "brand", "model", "year"::TEXT),
    "observations" = CASE
        WHEN "chassis_number" IS NULL THEN NULL
        ELSE 'Chassi: ' || "chassis_number"
    END;

ALTER TABLE "vehicles"
ALTER COLUMN "title" SET NOT NULL;

DROP INDEX IF EXISTS "vehicles_chassis_number_key";

ALTER TABLE "vehicles"
DROP COLUMN "brand",
DROP COLUMN "model",
DROP COLUMN "year",
DROP COLUMN "chassis_number",
DROP COLUMN "last_maintenance_kilometer",
DROP COLUMN "last_maintenance_date";

-- Preserve history descriptions, previous odometer readings and item details.
UPDATE "vehicles_history"
SET "description" = CASE
    WHEN NULLIF("description", '') IS NULL THEN "title"
    WHEN NULLIF("title", '') IS NULL THEN "description"
    ELSE "title" || ': ' || "description"
END;

UPDATE "vehicles_history"
SET "description" = concat_ws(
    E'\n',
    "description",
    'Leitura anterior: ' || "previous_kilometer"::TEXT || ' km'
)
WHERE "event_type" = 'odometer_change'
AND "previous_kilometer" IS NOT NULL;

UPDATE "vehicles_history" AS history
SET "description" = concat_ws(E'\n', history."description", items."items_description")
FROM (
    SELECT
        "history_id",
        string_agg(
            'Item: ' || "title" ||
            CASE
                WHEN NULLIF("description", '') IS NULL THEN ''
                ELSE ' - ' || "description"
            END,
            E'\n' ORDER BY "created_at", "id"
        ) AS "items_description"
    FROM "vehicles_history_items"
    GROUP BY "history_id"
) AS items
WHERE items."history_id" = history."id";

ALTER TABLE "vehicles_history"
RENAME COLUMN "kilometer" TO "kilometer_snapshot";

UPDATE "vehicles_history"
SET "event_type" = CASE
    WHEN "event_type" = 'odometer_change' THEN 'odometer_reset'
    WHEN "event_type" = 'inspection' THEN 'observation'
    ELSE "event_type"
END;

ALTER TABLE "vehicles_history"
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "event_date" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "title",
DROP COLUMN "previous_kilometer";

DROP TABLE "vehicles_history_items";
