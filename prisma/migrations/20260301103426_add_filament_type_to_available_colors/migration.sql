-- AlterTable
ALTER TABLE "available_color" ADD COLUMN "filamentType" VARCHAR NOT NULL DEFAULT 'PLA';

-- CreateIndex
CREATE INDEX "available_color_filamentType_idx" ON "available_color"("filamentType");

-- CreateIndex
CREATE INDEX "available_color_active_idx" ON "available_color"("active");
