-- CreateTable
CREATE TABLE "todays_choice" (
    "id" TEXT NOT NULL,
    "stickerId" TEXT,
    "partId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "todays_choice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "todays_choice_stickerId_idx" ON "todays_choice"("stickerId");

-- CreateIndex
CREATE INDEX "todays_choice_partId_idx" ON "todays_choice"("partId");

-- AddForeignKey
ALTER TABLE "todays_choice" ADD CONSTRAINT "todays_choice_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES "sticker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "todays_choice" ADD CONSTRAINT "todays_choice_partId_fkey" FOREIGN KEY ("partId") REFERENCES "part"("id") ON DELETE SET NULL ON UPDATE CASCADE;
