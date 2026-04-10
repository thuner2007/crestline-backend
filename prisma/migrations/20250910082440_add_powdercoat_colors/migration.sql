-- CreateTable
CREATE TABLE "powerdercoat_color" (
    "id" TEXT NOT NULL,
    "color" VARCHAR NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "powerdercoat_color_pkey" PRIMARY KEY ("id")
);
