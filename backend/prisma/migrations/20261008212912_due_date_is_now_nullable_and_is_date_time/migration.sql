/*
  Warnings:

  - The `due_date` column on the `monthly_expenses` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "monthly_expenses" DROP COLUMN "due_date",
ADD COLUMN     "due_date" TIMESTAMP(3);
