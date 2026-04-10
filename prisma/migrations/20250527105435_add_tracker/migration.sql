-- CreateTable
CREATE TABLE "tracker" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "lastVisit" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tracker_path_key" ON "tracker"("path");
