-- CreateTable
CREATE TABLE "_PartAccessories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PartAccessories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PartAccessories_B_index" ON "_PartAccessories"("B");

-- AddForeignKey
ALTER TABLE "_PartAccessories" ADD CONSTRAINT "_PartAccessories_A_fkey" FOREIGN KEY ("A") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartAccessories" ADD CONSTRAINT "_PartAccessories_B_fkey" FOREIGN KEY ("B") REFERENCES "part"("id") ON DELETE CASCADE ON UPDATE CASCADE;
