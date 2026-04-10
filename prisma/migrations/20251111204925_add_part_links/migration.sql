-- CreateTable
CREATE TABLE "part_link" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "part_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_link_translation" (
    "id" TEXT NOT NULL,
    "partLinkId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "url" VARCHAR NOT NULL,
    "title" VARCHAR NOT NULL,

    CONSTRAINT "part_link_translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "part_link_partId_idx" ON "part_link"("partId");

-- CreateIndex
CREATE INDEX "part_link_translation_partLinkId_idx" ON "part_link_translation"("partLinkId");

-- CreateIndex
CREATE INDEX "part_link_translation_language_idx" ON "part_link_translation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "part_link_translation_partLinkId_language_key" ON "part_link_translation"("partLinkId", "language");

-- AddForeignKey
ALTER TABLE "part_link" ADD CONSTRAINT "part_link_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_link_translation" ADD CONSTRAINT "part_link_translation_partLinkId_fkey" FOREIGN KEY ("partLinkId") REFERENCES "part_link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
