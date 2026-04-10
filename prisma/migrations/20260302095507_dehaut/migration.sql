/*
  Warnings:

  - You are about to drop the `_filament_typeTOpart` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_filament_typeTOpart" DROP CONSTRAINT "_filament_typeTOpart_A_fkey";

-- DropForeignKey
ALTER TABLE "_filament_typeTOpart" DROP CONSTRAINT "_filament_typeTOpart_B_fkey";

-- DropTable
DROP TABLE "_filament_typeTOpart";

-- CreateTable
CREATE TABLE "_filament_typeTopart" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_filament_typeTopart_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_filament_typeTopart_B_index" ON "_filament_typeTopart"("B");

-- AddForeignKey
ALTER TABLE "_filament_typeTopart" ADD CONSTRAINT "_filament_typeTopart_A_fkey" FOREIGN KEY ("A") REFERENCES "filament_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_filament_typeTopart" ADD CONSTRAINT "_filament_typeTopart_B_fkey" FOREIGN KEY ("B") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;
