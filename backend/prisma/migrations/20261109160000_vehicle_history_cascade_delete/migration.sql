-- A vehicle owns its history records; deleting the vehicle also deletes its history.
ALTER TABLE "vehicles_history"
DROP CONSTRAINT "vehicles_history_vehicle_id_fkey";

ALTER TABLE "vehicles_history"
ADD CONSTRAINT "vehicles_history_vehicle_id_fkey"
FOREIGN KEY ("vehicle_id")
REFERENCES "vehicles"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
