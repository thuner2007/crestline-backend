-- CreateEnum
CREATE TYPE "shipping_carrier_enum" AS ENUM ('swiss_post', 'ups');

-- AlterTable
ALTER TABLE "sticker_order" ADD COLUMN "shipmentCarrier" "shipping_carrier_enum";
