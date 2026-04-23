/*
  Warnings:

  - You are about to drop the `_cartTopowdercoat_order_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blog_image` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blog_link` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blog_link_translation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blog_post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `blog_post_translation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `powdercoat_order_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `powdercoating_service` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `powerdercoat_color` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_cartTopowdercoat_order_item" DROP CONSTRAINT "_cartTopowdercoat_order_item_A_fkey";

-- DropForeignKey
ALTER TABLE "_cartTopowdercoat_order_item" DROP CONSTRAINT "_cartTopowdercoat_order_item_B_fkey";

-- DropForeignKey
ALTER TABLE "blog_image" DROP CONSTRAINT "blog_image_blogPostId_fkey";

-- DropForeignKey
ALTER TABLE "blog_link" DROP CONSTRAINT "blog_link_blogPostId_fkey";

-- DropForeignKey
ALTER TABLE "blog_link_translation" DROP CONSTRAINT "blog_link_translation_blogLinkId_fkey";

-- DropForeignKey
ALTER TABLE "blog_post_translation" DROP CONSTRAINT "blog_post_translation_blogPostId_fkey";

-- DropForeignKey
ALTER TABLE "powdercoat_order_item" DROP CONSTRAINT "powdercoat_order_item_orderId_fkey";

-- DropForeignKey
ALTER TABLE "powdercoat_order_item" DROP CONSTRAINT "powdercoat_order_item_powdercoatingServiceId_fkey";

-- DropTable
DROP TABLE "_cartTopowdercoat_order_item";

-- DropTable
DROP TABLE "blog_image";

-- DropTable
DROP TABLE "blog_link";

-- DropTable
DROP TABLE "blog_link_translation";

-- DropTable
DROP TABLE "blog_post";

-- DropTable
DROP TABLE "blog_post_translation";

-- DropTable
DROP TABLE "powdercoat_order_item";

-- DropTable
DROP TABLE "powdercoating_service";

-- DropTable
DROP TABLE "powerdercoat_color";

-- CreateTable
CREATE TABLE "part_section" (
    "id" TEXT NOT NULL,
    "sortingRank" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "part_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_section_translation" (
    "id" TEXT NOT NULL,
    "partSectionId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" VARCHAR NOT NULL,
    "description" VARCHAR,

    CONSTRAINT "part_section_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_partTopart_section" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_partTopart_section_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "part_section_active_idx" ON "part_section"("active");

-- CreateIndex
CREATE UNIQUE INDEX "part_section_translation_partSectionId_language_key" ON "part_section_translation"("partSectionId", "language");

-- CreateIndex
CREATE INDEX "_partTopart_section_B_index" ON "_partTopart_section"("B");

-- AddForeignKey
ALTER TABLE "part_section_translation" ADD CONSTRAINT "part_section_translation_partSectionId_fkey" FOREIGN KEY ("partSectionId") REFERENCES "part_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_partTopart_section" ADD CONSTRAINT "_partTopart_section_A_fkey" FOREIGN KEY ("A") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_partTopart_section" ADD CONSTRAINT "_partTopart_section_B_fkey" FOREIGN KEY ("B") REFERENCES "part_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
