-- Convert existing fixed-amount discounts to percentages before changing their meaning.
-- Item discounts are calculated against quantity * unit_value.
UPDATE "budget_items"
SET "discount" = CASE
    WHEN ("quantity" * "unit_value") = 0 THEN 0
    ELSE ("discount" / ("quantity" * "unit_value")) * 100
END;

-- Global discounts are calculated against the sum of item totals (after item discounts).
UPDATE "budgets" AS budget
SET "global_discount" = CASE
    WHEN COALESCE(items."total_amount", 0) = 0 THEN 0
    ELSE (budget."global_discount" / items."total_amount") * 100
END
FROM (
    SELECT "budget_id", SUM("total_amount") AS "total_amount"
    FROM "budget_items"
    GROUP BY "budget_id"
) AS items
WHERE budget."id" = items."budget_id";

-- Category grouping is now based on the category name, not a separate type.
DROP INDEX "budget_categories_type_idx";
ALTER TABLE "budget_categories" DROP COLUMN "type";
