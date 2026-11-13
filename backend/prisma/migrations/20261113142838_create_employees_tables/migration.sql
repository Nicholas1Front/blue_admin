-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf_cnpj" VARCHAR(14),
    "address" TEXT,
    "birth_date" TIMESTAMP(3),
    "observations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_engagements" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "exit_date" TIMESTAMP(3),
    "position" TEXT,
    "current_salary" DECIMAL(65,30),
    "daily_hours" DECIMAL(65,30),
    "modality" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "termination_reason" TEXT,
    "notice_type" TEXT,
    "notice_date" TIMESTAMP(3),
    "notice_end_date" TIMESTAMP(3),
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
    "original_value" DECIMAL(65,30),
    "final_value" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'em_revisao',
    "reference_start" TIMESTAMP(3),
    "reference_end" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'manual',
    "reference_key" TEXT,
    "calculation_details" JSONB,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_obligations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_movements" (
    "id" TEXT NOT NULL,
    "engagement_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(65,30),
    "event_date" TIMESTAMP(3) NOT NULL,
    "transaction_id" TEXT,
    "obligation_id" TEXT,
    "source_movement_id" TEXT,
    "duration_minutes" INTEGER,
    "absence_days" INTEGER,
    "justification_status" TEXT,
    "created_by_id" TEXT,
    "reversed_at" TIMESTAMP(3),
    "reversal_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_payment_allocations" (
    "id" TEXT NOT NULL,
    "movement_id" TEXT NOT NULL,
    "obligation_id" TEXT,
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
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "event_date" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_cnpj_key" ON "employees"("cpf_cnpj");

-- CreateIndex
CREATE INDEX "employees_name_idx" ON "employees"("name");

-- CreateIndex
CREATE INDEX "employee_engagements_employee_id_entry_date_idx" ON "employee_engagements"("employee_id", "entry_date");

-- CreateIndex
CREATE INDEX "employee_engagements_status_entry_date_idx" ON "employee_engagements"("status", "entry_date");

-- CreateIndex
CREATE INDEX "employee_engagements_exit_date_idx" ON "employee_engagements"("exit_date");

-- CreateIndex
CREATE INDEX "employee_obligations_engagement_id_status_due_date_idx" ON "employee_obligations"("engagement_id", "status", "due_date");

-- CreateIndex
CREATE INDEX "employee_obligations_type_reference_start_reference_end_idx" ON "employee_obligations"("type", "reference_start", "reference_end");

-- CreateIndex
CREATE UNIQUE INDEX "employee_obligations_engagement_id_reference_key_key" ON "employee_obligations"("engagement_id", "reference_key");

-- CreateIndex
CREATE UNIQUE INDEX "employee_movements_transaction_id_key" ON "employee_movements"("transaction_id");

-- CreateIndex
CREATE INDEX "employee_movements_engagement_id_event_date_idx" ON "employee_movements"("engagement_id", "event_date");

-- CreateIndex
CREATE INDEX "employee_movements_type_event_date_idx" ON "employee_movements"("type", "event_date");

-- CreateIndex
CREATE INDEX "employee_movements_obligation_id_idx" ON "employee_movements"("obligation_id");

-- CreateIndex
CREATE INDEX "employee_movements_source_movement_id_idx" ON "employee_movements"("source_movement_id");

-- CreateIndex
CREATE INDEX "employee_payment_allocations_movement_id_idx" ON "employee_payment_allocations"("movement_id");

-- CreateIndex
CREATE INDEX "employee_payment_allocations_obligation_id_idx" ON "employee_payment_allocations"("obligation_id");

-- CreateIndex
CREATE INDEX "employee_payment_allocations_type_created_at_idx" ON "employee_payment_allocations"("type", "created_at");

-- CreateIndex
CREATE INDEX "employee_history_employee_id_event_date_idx" ON "employee_history"("employee_id", "event_date");

-- CreateIndex
CREATE INDEX "employee_history_engagement_id_event_date_idx" ON "employee_history"("engagement_id", "event_date");

-- CreateIndex
CREATE INDEX "employee_history_type_event_date_idx" ON "employee_history"("type", "event_date");

-- AddForeignKey
ALTER TABLE "employee_engagements" ADD CONSTRAINT "employee_engagements_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_obligations" ADD CONSTRAINT "employee_obligations_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "employee_engagements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_obligations" ADD CONSTRAINT "employee_obligations_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_movements" ADD CONSTRAINT "employee_movements_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "employee_engagements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_movements" ADD CONSTRAINT "employee_movements_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_movements" ADD CONSTRAINT "employee_movements_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "employee_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_movements" ADD CONSTRAINT "employee_movements_source_movement_id_fkey" FOREIGN KEY ("source_movement_id") REFERENCES "employee_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_movements" ADD CONSTRAINT "employee_movements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payment_allocations" ADD CONSTRAINT "employee_payment_allocations_movement_id_fkey" FOREIGN KEY ("movement_id") REFERENCES "employee_movements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_payment_allocations" ADD CONSTRAINT "employee_payment_allocations_obligation_id_fkey" FOREIGN KEY ("obligation_id") REFERENCES "employee_obligations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_engagement_id_fkey" FOREIGN KEY ("engagement_id") REFERENCES "employee_engagements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_history" ADD CONSTRAINT "employee_history_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
