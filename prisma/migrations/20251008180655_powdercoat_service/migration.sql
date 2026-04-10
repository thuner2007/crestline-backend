-- CreateTable
CREATE TABLE "part_option_stock" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "optionItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "part_option_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "powdercoating_service" (
    "id" TEXT NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "powdercoating_service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "part_option_stock_partId_idx" ON "part_option_stock"("partId");

-- CreateIndex
CREATE INDEX "part_option_stock_optionId_idx" ON "part_option_stock"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "part_option_stock_partId_optionId_optionItemId_key" ON "part_option_stock"("partId", "optionId", "optionItemId");

-- AddForeignKey
ALTER TABLE "part_option_stock" ADD CONSTRAINT "part_option_stock_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;
