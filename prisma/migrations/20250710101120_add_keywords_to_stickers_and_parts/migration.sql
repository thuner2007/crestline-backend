-- AlterTable
ALTER TABLE "part" ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "sticker" ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
