/*
  Warnings:

  - The primary key for the `tracker` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `tracker` table. All the data in the column will be lost.
  - You are about to drop the column `lastVisit` on the `tracker` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "tracker_path_key";

-- AlterTable
ALTER TABLE "tracker" DROP CONSTRAINT "tracker_pkey",
DROP COLUMN "id",
DROP COLUMN "lastVisit",
ADD COLUMN     "last_visit" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "tracker_pkey" PRIMARY KEY ("path");
