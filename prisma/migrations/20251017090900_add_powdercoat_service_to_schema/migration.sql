-- CreateTable
CREATE TABLE "powdercoat_order_item" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "powdercoatingServiceId" TEXT,
    "color" VARCHAR,
    "customizationOptions" JSONB NOT NULL DEFAULT '{}',
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "powdercoat_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_cartTopowdercoat_order_item" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_cartTopowdercoat_order_item_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "powdercoat_order_item_orderId_powdercoatingServiceId_key" ON "powdercoat_order_item"("orderId", "powdercoatingServiceId");

-- CreateIndex
CREATE INDEX "_cartTopowdercoat_order_item_B_index" ON "_cartTopowdercoat_order_item"("B");

-- AddForeignKey
ALTER TABLE "powdercoat_order_item" ADD CONSTRAINT "powdercoat_order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sticker_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "powdercoat_order_item" ADD CONSTRAINT "powdercoat_order_item_powdercoatingServiceId_fkey" FOREIGN KEY ("powdercoatingServiceId") REFERENCES "powdercoating_service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cartTopowdercoat_order_item" ADD CONSTRAINT "_cartTopowdercoat_order_item_A_fkey" FOREIGN KEY ("A") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_cartTopowdercoat_order_item" ADD CONSTRAINT "_cartTopowdercoat_order_item_B_fkey" FOREIGN KEY ("B") REFERENCES "powdercoat_order_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
