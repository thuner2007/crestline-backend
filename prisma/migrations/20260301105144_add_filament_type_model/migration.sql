-- CreateTable
CREATE TABLE "filament_type" (
    "id" TEXT NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "filament_type_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "available_color" ADD COLUMN "filamentTypeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "filament_type_name_key" ON "filament_type"("name");

-- CreateIndex
CREATE INDEX "filament_type_active_idx" ON "filament_type"("active");

-- CreateIndex
CREATE INDEX "available_color_filamentTypeId_idx" ON "available_color"("filamentTypeId");

-- AddForeignKey
ALTER TABLE "available_color" ADD CONSTRAINT "available_color_filamentTypeId_fkey" FOREIGN KEY ("filamentTypeId") REFERENCES "filament_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default filament types
INSERT INTO "filament_type" ("id", "name", "description", "active", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'PLA', 'Polylactic Acid - Easy to print, biodegradable, good for general use', true, NOW(), NOW()),
  (gen_random_uuid(), 'PETG', 'Polyethylene Terephthalate Glycol - Strong, durable, chemical resistant', true, NOW(), NOW()),
  (gen_random_uuid(), 'TPU', 'Thermoplastic Polyurethane - Flexible, elastic, impact resistant', true, NOW(), NOW()),
  (gen_random_uuid(), 'ASA', 'Acrylonitrile Styrene Acrylate - Weather resistant, UV stable, outdoor use', true, NOW(), NOW());
