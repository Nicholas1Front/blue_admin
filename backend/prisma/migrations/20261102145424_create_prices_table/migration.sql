-- CreateTable
CREATE TABLE "budget_prices" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "unit_value" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budget_prices_category_id_idx" ON "budget_prices"("category_id");

-- CreateIndex
CREATE INDEX "budget_prices_title_idx" ON "budget_prices"("title");

-- CreateIndex
CREATE INDEX "budget_prices_created_at_idx" ON "budget_prices"("created_at");

-- AddForeignKey
ALTER TABLE "budget_prices" ADD CONSTRAINT "budget_prices_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "budget_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
