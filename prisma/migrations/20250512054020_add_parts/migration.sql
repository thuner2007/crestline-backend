-- CreateTable
CREATE TABLE "part_group" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "part_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part" (
    "id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER DEFAULT 0,
    "customizationOptions" JSONB NOT NULL DEFAULT '{}',
    "images" TEXT[],
    "sold" INTEGER NOT NULL DEFAULT 0,
    "sortingRank" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6),

    CONSTRAINT "part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_translation" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" VARCHAR NOT NULL,
    "description" VARCHAR,

    CONSTRAINT "part_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_group_translation" (
    "id" TEXT NOT NULL,
    "partGroupId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" VARCHAR NOT NULL,

    CONSTRAINT "part_group_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_order_item" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "partId" TEXT,
    "customizationOptions" JSONB NOT NULL DEFAULT '{}',
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "part_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_partTopart_group" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_partTopart_group_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "part_active_idx" ON "part"("active");

-- CreateIndex
CREATE UNIQUE INDEX "part_translation_partId_language_key" ON "part_translation"("partId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "part_group_translation_partGroupId_language_key" ON "part_group_translation"("partGroupId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "part_order_item_orderId_partId_key" ON "part_order_item"("orderId", "partId");

-- CreateIndex
CREATE INDEX "_partTopart_group_B_index" ON "_partTopart_group"("B");

-- AddForeignKey
ALTER TABLE "part_translation" ADD CONSTRAINT "part_translation_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_group_translation" ADD CONSTRAINT "part_group_translation_partGroupId_fkey" FOREIGN KEY ("partGroupId") REFERENCES "part_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_order_item" ADD CONSTRAINT "part_order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sticker_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_order_item" ADD CONSTRAINT "part_order_item_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_partTopart_group" ADD CONSTRAINT "_partTopart_group_A_fkey" FOREIGN KEY ("A") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_partTopart_group" ADD CONSTRAINT "_partTopart_group_B_fkey" FOREIGN KEY ("B") REFERENCES "part_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
