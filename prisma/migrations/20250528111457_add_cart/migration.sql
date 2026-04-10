-- AlterEnum
ALTER TYPE "sticker_order_status_enum" ADD VALUE 'CART_TEMP';

-- CreateTable
CREATE TABLE "cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_cartToorder_item" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_cartToorder_item_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_cartToorder_item_B_index" ON "_cartToorder_item"("B");

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cartToorder_item" ADD CONSTRAINT "_cartToorder_item_A_fkey" FOREIGN KEY ("A") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cartToorder_item" ADD CONSTRAINT "_cartToorder_item_B_fkey" FOREIGN KEY ("B") REFERENCES "order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
