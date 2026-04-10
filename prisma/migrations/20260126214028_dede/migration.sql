/*
  Warnings:

  - A unique constraint covering the columns `[anonymousToken]` on the table `cart` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "cart" ADD COLUMN     "anonymousExpiresAt" TIMESTAMPTZ(6),
ADD COLUMN     "anonymousToken" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "cart_anonymousToken_key" ON "cart"("anonymousToken");

-- CreateIndex
CREATE INDEX "cart_anonymousToken_idx" ON "cart"("anonymousToken");

-- CreateIndex
CREATE INDEX "cart_anonymousExpiresAt_idx" ON "cart"("anonymousExpiresAt");
