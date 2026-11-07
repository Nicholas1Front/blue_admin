-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "plate" TEXT,
    "renavam" TEXT,
    "chassis_number" TEXT,
    "current_kilometer" INTEGER,
    "last_maintenance_kilometer" INTEGER,
    "last_maintenance_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles_history" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "kilometer" INTEGER,
    "previous_kilometer" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles_history_items" (
    "id" TEXT NOT NULL,
    "history_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_history_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_renavam_key" ON "vehicles"("renavam");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_chassis_number_key" ON "vehicles"("chassis_number");

-- CreateIndex
CREATE INDEX "vehicles_history_vehicle_id_event_date_idx" ON "vehicles_history"("vehicle_id", "event_date");

-- CreateIndex
CREATE INDEX "vehicles_history_event_type_event_date_idx" ON "vehicles_history"("event_type", "event_date");

-- CreateIndex
CREATE INDEX "vehicles_history_items_history_id_idx" ON "vehicles_history_items"("history_id");

-- CreateIndex
CREATE INDEX "vehicles_history_items_title_idx" ON "vehicles_history_items"("title");

-- AddForeignKey
ALTER TABLE "vehicles_history" ADD CONSTRAINT "vehicles_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles_history_items" ADD CONSTRAINT "vehicles_history_items_history_id_fkey" FOREIGN KEY ("history_id") REFERENCES "vehicles_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;
