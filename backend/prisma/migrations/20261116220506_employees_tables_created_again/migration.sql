-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_engagements" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3),
    "exit_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "current_salary" DECIMAL(65,30),
    "hourly_rate" DECIMAL(65,30),
    "modality" TEXT NOT NULL,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_obligations" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reference_start" TIMESTAMP(3),
    "reference_end" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "original_value" DECIMAL(65,30) NOT NULL,
    "final_value" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_movements" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "event_date" TIMESTAMP(3),
    "reference_start" TIMESTAMP(3),
    "reference_end" TIMESTAMP(3),
    "value" DECIMAL(65,30),
    "obligation_id" TEXT,
    "financial_transaction_id" TEXT,
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_payment_allocations" (
    "id" TEXT NOT NULL,
    "movement_id" TEXT NOT NULL,
    "obligation_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_history" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "engagement_id" TEXT,
    "event_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "event_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_engagements_employee_id_idx" ON "employee_engagements"("employee_id");

-- CreateIndex
CREATE INDEX "employee_engagements_status_idx" ON "employee_engagements"("status");

-- CreateIndex
CREATE INDEX "employee_obligations_engagement_id_idx" ON "employee_obligations"("engagement_id");

-- CreateIndex
CREATE INDEX "employee_obligations_engagement_id_due_date_idx" ON "employee_obligations"("engagement_id", "due_date");

-- CreateIndex
CREATE INDEX "employee_obligations_engagement_id_type_reference_start_idx" ON "employee_obligations"("engagement_id", "type", "reference_start");

-- CreateIndex
CREATE INDEX "employee_obligations_status_idx" ON "employee_obligations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_movements_financial_transaction_id_key" ON "employee_movements"("financial_transaction_id");

-- CreateIndex
CREATE INDEX "employee_movements_engagement_id_event_date_idx" ON "employee_movements"("engagement_id", "event_date");

-- CreateIndex
CREATE INDEX "employee_movements_obligation_id_idx" ON "employee_movements"("obligation_id");

-- CreateIndex
CREATE INDEX "employee_payment_allocations_movement_id_idx" ON "employee_payment_allocations"("movement_id");

-- CreateIndex
CREATE INDEX "employee_payment_allocations_obligation_id_idx" ON "employee_payment_allocations"("obligation_id");

-- CreateIndex
CREATE INDEX "employee_history_employee_id_created_at_idx" ON "employee_history"("employee_id", "created_at");

-- CreateIndex
CREATE INDEX "employee_history_engagement_id_created_at_idx" ON "employee_history"("engagement_id", "created_at");

-- AddForeignKey
ALTER TABLE "employee_engagements" ADD CONSTRAINT "employee_engagements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_obligations" ADD CONSTRAINT "employee_obligations_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "employee_engagements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_movements" ADD CONSTRAINT "employee_movements_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "employee_engagements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_movements" ADD CONSTRAINT "employee_movements_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "employee_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_movements" ADD CONSTRAINT "employee_movements_financial_transaction_id_fkey" FOREIGN KEY ("financial_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payment_allocations" ADD CONSTRAINT "employee_payment_allocations_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "employee_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payment_allocations" ADD CONSTRAINT "employee_payment_allocations_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "employee_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "employee_engagements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
