-- CreateTable
CREATE TABLE "_cartTopart_order_item" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_cartTopart_order_item_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_cartTopart_order_item_B_index" ON "_cartTopart_order_item"("B");

-- AddForeignKey
ALTER TABLE "_cartTopart_order_item" ADD CONSTRAINT "_cartTopart_order_item_A_fkey" FOREIGN KEY ("A") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cartTopart_order_item" ADD CONSTRAINT "_cartTopart_order_item_B_fkey" FOREIGN KEY ("B") REFERENCES "part_order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
