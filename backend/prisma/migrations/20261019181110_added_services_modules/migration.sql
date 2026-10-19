/*
  Warnings:

  - You are about to drop the `Equipament` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Equipament" DROP CONSTRAINT "Equipament_client_id_fkey";

-- DropTable
DROP TABLE "Equipament";

-- CreateTable
CREATE TABLE "equipaments" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT,
    "main_identification" TEXT,
    "additional_identification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exit_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "hours_worked" DECIMAL(65,30),
    "cost_per_hour" DECIMAL(65,30),
    "tithe_status" TEXT DEFAULT 'pending',
    "tithe_transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services_history" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services_activities" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'concluded',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services_equipaments" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "equipament_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "services_equipaments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "services_tithe_transaction_id_key" ON "services"("tithe_transaction_id");

-- CreateIndex
CREATE INDEX "services_client_id_idx" ON "services"("client_id");

-- CreateIndex
CREATE INDEX "services_status_idx" ON "services"("status");

-- CreateIndex
CREATE INDEX "services_entry_date_idx" ON "services"("entry_date");

-- CreateIndex
CREATE INDEX "services_history_service_id_created_at_idx" ON "services_history"("service_id", "created_at");

-- CreateIndex
CREATE INDEX "services_activities_service_id_idx" ON "services_activities"("service_id");

-- CreateIndex
CREATE INDEX "services_equipaments_equipament_id_idx" ON "services_equipaments"("equipament_id");

-- CreateIndex
CREATE UNIQUE INDEX "services_equipaments_service_id_equipament_id_key" ON "services_equipaments"("service_id", "equipament_id");

-- CreateIndex
CREATE INDEX "financial_transactions_origin_type_origin_id_idx" ON "financial_transactions"("origin_type", "origin_id");

-- AddForeignKey
ALTER TABLE "equipaments" ADD CONSTRAINT "equipaments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_tithe_transaction_id_fkey" FOREIGN KEY ("tithe_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services_history" ADD CONSTRAINT "services_history_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services_activities" ADD CONSTRAINT "services_activities_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services_equipaments" ADD CONSTRAINT "services_equipaments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services_equipaments" ADD CONSTRAINT "services_equipaments_equipament_id_fkey" FOREIGN KEY ("equipament_id") REFERENCES "equipaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
