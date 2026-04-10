-- CreateTable
CREATE TABLE "email_validation" (
    "id" TEXT NOT NULL,
    "email" VARCHAR NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_validation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_validation_email_key" ON "email_validation"("email");
