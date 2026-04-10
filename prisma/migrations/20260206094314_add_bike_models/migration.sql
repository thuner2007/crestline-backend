-- CreateTable
CREATE TABLE "bike_model" (
    "id" TEXT NOT NULL,
    "manufacturer" VARCHAR NOT NULL,
    "model" VARCHAR NOT NULL,
    "year" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "bike_model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_bike_modelTopart" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_bike_modelTopart_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "bike_model_manufacturer_idx" ON "bike_model"("manufacturer");

-- CreateIndex
CREATE INDEX "bike_model_active_idx" ON "bike_model"("active");

-- CreateIndex
CREATE UNIQUE INDEX "bike_model_manufacturer_model_year_key" ON "bike_model"("manufacturer", "model", "year");

-- CreateIndex
CREATE INDEX "_bike_modelTopart_B_index" ON "_bike_modelTopart"("B");

-- AddForeignKey
ALTER TABLE "_bike_modelTopart" ADD CONSTRAINT "_bike_modelTopart_A_fkey" FOREIGN KEY ("A") REFERENCES "bike_model"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_bike_modelTopart" ADD CONSTRAINT "_bike_modelTopart_B_fkey" FOREIGN KEY ("B") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;
