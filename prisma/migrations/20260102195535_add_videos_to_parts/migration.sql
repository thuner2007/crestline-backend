-- AlterTable
ALTER TABLE "part" ADD COLUMN "videos" TEXT[] DEFAULT ARRAY[]::TEXT[];
