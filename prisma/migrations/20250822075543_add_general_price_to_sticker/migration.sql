-- AlterTable
ALTER TABLE "sticker" ADD COLUMN     "generalPrice" DECIMAL(10,2),
ADD COLUMN     "price" DECIMAL(10,2),
ALTER COLUMN "pricePerCm2Printable" DROP NOT NULL,
ALTER COLUMN "pricePerCm2Vinyl" DROP NOT NULL;
