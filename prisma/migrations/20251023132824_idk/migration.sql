/*
  Warnings:

  - The primary key for the `tracker` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `last_visit` on the `tracker` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[path]` on the table `tracker` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `tracker` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "tracker" DROP CONSTRAINT "tracker_pkey",
DROP COLUMN "last_visit",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "lastVisit" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "tracker_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "tracker_path_key" ON "tracker"("path");
