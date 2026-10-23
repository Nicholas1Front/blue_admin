-- Keep the origin discriminator consistent with the services module.
UPDATE "financial_transactions"
SET "origin_type" = 'services'
WHERE "origin_type" = 'service';
