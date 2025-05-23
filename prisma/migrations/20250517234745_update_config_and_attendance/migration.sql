/*
  Warnings:

  - You are about to drop the column `lateLimitMin` on the `Config` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "checkIn" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Config" DROP COLUMN "lateLimitMin";
