/*
  Warnings:

  - Made the column `description` on table `services_history` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "services_history" ALTER COLUMN "description" SET NOT NULL;
