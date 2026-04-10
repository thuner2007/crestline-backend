/*
  Warnings:

  - You are about to drop the column `title` on the `blog_link` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `blog_link` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blog_link" DROP COLUMN "title",
DROP COLUMN "url";

-- CreateTable
CREATE TABLE "blog_link_translation" (
    "id" TEXT NOT NULL,
    "blogLinkId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "url" VARCHAR NOT NULL,
    "title" VARCHAR NOT NULL,

    CONSTRAINT "blog_link_translation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_link_translation_blogLinkId_idx" ON "blog_link_translation"("blogLinkId");

-- CreateIndex
CREATE INDEX "blog_link_translation_language_idx" ON "blog_link_translation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "blog_link_translation_blogLinkId_language_key" ON "blog_link_translation"("blogLinkId", "language");

-- AddForeignKey
ALTER TABLE "blog_link_translation" ADD CONSTRAINT "blog_link_translation_blogLinkId_fkey" FOREIGN KEY ("blogLinkId") REFERENCES "blog_link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
