-- Keep the origin discriminator consistent with the services module.
UPDATE "financial_transactions"
SET "origin_type" = 'services'
WHERE "origin_type" = 'service';

-- Fail safely rather than accepting existing records with only half an origin.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "financial_transactions"
    WHERE ("origin_id" IS NULL) <> ("origin_type" IS NULL)
  ) THEN
    RAISE EXCEPTION 'Cannot enforce transaction origins: origin_id and origin_type must both be NULL or both be populated.';
  END IF;
END $$;

ALTER TABLE "financial_transactions"
ADD CONSTRAINT "financial_transactions_origin_pair_check"
CHECK (
  ("origin_id" IS NULL AND "origin_type" IS NULL)
  OR
  ("origin_id" IS NOT NULL AND "origin_type" IS NOT NULL)
);
