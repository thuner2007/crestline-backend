/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `order_item` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "order_item_orderId_stickerId_key";

-- CreateIndex
CREATE UNIQUE INDEX "order_item_orderId_key" ON "order_item"("orderId");
