-- CreateEnum
CREATE TYPE "shipping_ready_enum" AS ENUM ('now', 'in_1_3_days', 'in_4_7_days', 'in_8_14_days', 'unknown');

-- AlterTable
ALTER TABLE "part" ADD COLUMN     "shippingReady" "shipping_ready_enum" NOT NULL DEFAULT 'unknown';
