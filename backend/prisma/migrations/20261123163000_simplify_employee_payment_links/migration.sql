-- Remove the old payment-allocation model. EmployeeMovement now points directly to one obligation.
ALTER TABLE "employee_payment_allocations" DROP CONSTRAINT "employee_payment_allocations_movement_id_fkey";
ALTER TABLE "employee_payment_allocations" DROP CONSTRAINT "employee_payment_allocations_obligation_id_fkey";
DROP TABLE "employee_payment_allocations";

-- A financial transaction may be shared by multiple employee movements.
DROP INDEX "employee_movements_financial_transaction_id_key";
CREATE INDEX "employee_movements_financial_transaction_id_idx"
ON "employee_movements"("financial_transaction_id");
