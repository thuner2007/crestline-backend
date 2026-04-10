/*
  Warnings:

  - The values [CART_TEMP] on the enum `sticker_order_status_enum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "sticker_order_status_enum_new" AS ENUM ('stand', 'pending', 'processing', 'completed', 'cancelled', 'cart_temp');
ALTER TABLE "sticker_order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "sticker_order" ALTER COLUMN "status" TYPE "sticker_order_status_enum_new" USING ("status"::text::"sticker_order_status_enum_new");
ALTER TYPE "sticker_order_status_enum" RENAME TO "sticker_order_status_enum_old";
ALTER TYPE "sticker_order_status_enum_new" RENAME TO "sticker_order_status_enum";
DROP TYPE "sticker_order_status_enum_old";
ALTER TABLE "sticker_order" ALTER COLUMN "status" SET DEFAULT 'stand';
COMMIT;
