/*
  Warnings:

  - The `modality` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "modality",
ADD COLUMN     "modality" "Modality" NOT NULL DEFAULT 'PRESENTIAL';

-- DropEnum
DROP TYPE "ModalityUser";
