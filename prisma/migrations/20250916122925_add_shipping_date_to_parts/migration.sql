-- AlterEnum
ALTER TYPE "shipping_ready_enum" ADD VALUE 'pre_order';

-- AlterTable
ALTER TABLE "part" ADD COLUMN     "shippingDate" TIMESTAMPTZ(6);
