-- CreateTable
CREATE TABLE "_filament_typeTOpart" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_filament_typeTOpart_AB_unique" ON "_filament_typeTOpart"("A", "B");

-- CreateIndex
CREATE INDEX "_filament_typeTOpart_B_index" ON "_filament_typeTOpart"("B");

-- AddForeignKey
ALTER TABLE "_filament_typeTOpart" ADD CONSTRAINT "_filament_typeTOpart_A_fkey" FOREIGN KEY ("A") REFERENCES "filament_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_filament_typeTOpart" ADD CONSTRAINT "_filament_typeTOpart_B_fkey" FOREIGN KEY ("B") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;
