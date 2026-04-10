-- CreateEnum
CREATE TYPE "discount_type_enum" AS ENUM ('percentage', 'fixed');

-- CreateEnum
CREATE TYPE "sticker_order_paymentmethod_enum" AS ENUM ('card', 'paypal', 'bank_transfer', 'twint', 'other');

-- CreateEnum
CREATE TYPE "sticker_order_status_enum" AS ENUM ('stand', 'pending', 'processing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "user_role_enum" AS ENUM ('user', 'admin', 'moderator');

-- CreateEnum
CREATE TYPE "sticker_standard_method_enum" AS ENUM ('vinyl', 'printable');

-- CreateTable
CREATE TABLE "available_color" (
    "id" TEXT NOT NULL,
    "color" VARCHAR NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "available_color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_sticker" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "originalImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_sticker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount" (
    "id" TEXT NOT NULL,
    "code" VARCHAR NOT NULL,
    "type" "discount_type_enum" NOT NULL DEFAULT 'percentage',
    "value" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMPTZ(6),
    "validUntil" TIMESTAMPTZ(6),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUsage" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subgroup" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subgroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variation_group" (
    "id" TEXT NOT NULL,
    "name" VARCHAR NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variation_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sticker" (
    "id" TEXT NOT NULL,
    "pricePerCm2Printable" DECIMAL(10,2) NOT NULL,
    "pricePerCm2Vinyl" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER DEFAULT 0,
    "printable" BOOLEAN NOT NULL,
    "vinyl" BOOLEAN NOT NULL,
    "standardMethod" "sticker_standard_method_enum" NOT NULL DEFAULT 'vinyl',
    "customizationOptions" JSONB NOT NULL DEFAULT '{}',
    "images" TEXT[],
    "sold" INTEGER NOT NULL DEFAULT 0,
    "sortingRank" INTEGER NOT NULL DEFAULT 0,
    "widthToHeightRatio" DECIMAL(10,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "variationsGroupId" TEXT,
    "defaultInVariation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6),

    CONSTRAINT "sticker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sticker_translation" (
    "id" TEXT NOT NULL,
    "stickerId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" VARCHAR NOT NULL,
    "description" VARCHAR,

    CONSTRAINT "sticker_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_translation" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" VARCHAR NOT NULL,

    CONSTRAINT "group_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subgroup_translation" (
    "id" TEXT NOT NULL,
    "subgroupId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" VARCHAR NOT NULL,

    CONSTRAINT "subgroup_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sticker_order" (
    "id" TEXT NOT NULL,
    "firstName" VARCHAR,
    "lastName" VARCHAR,
    "email" VARCHAR,
    "phone" VARCHAR,
    "street" VARCHAR,
    "houseNumber" VARCHAR,
    "zipCode" VARCHAR,
    "city" VARCHAR,
    "country" VARCHAR,
    "additionalAddressInfo" VARCHAR,
    "userId" TEXT,
    "guestEmail" VARCHAR,
    "paymentMethod" "sticker_order_paymentmethod_enum" NOT NULL,
    "orderDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comment" VARCHAR,
    "status" "sticker_order_status_enum" NOT NULL DEFAULT 'stand',
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "shipmentCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountId" TEXT,

    CONSTRAINT "sticker_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stickerId" TEXT,
    "customStickerId" TEXT,
    "width" DECIMAL(65,30) NOT NULL,
    "height" DECIMAL(65,30) NOT NULL,
    "vinyl" BOOLEAN NOT NULL,
    "printed" BOOLEAN NOT NULL,
    "customizationOptions" JSONB NOT NULL DEFAULT '{}',
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "username" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "role" "user_role_enum" NOT NULL DEFAULT 'user',
    "firstName" VARCHAR,
    "lastName" VARCHAR,
    "email" VARCHAR,
    "phone" VARCHAR,
    "street" VARCHAR,
    "houseNumber" VARCHAR,
    "zipCode" VARCHAR,
    "city" VARCHAR,
    "country" VARCHAR,
    "additionalAddressInfo" VARCHAR,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "PK_5417af0062cf987495b611b59c7" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_groupTosubgroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_groupTosubgroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_groupTosticker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_groupTosticker_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_stickerTosubgroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_stickerTosubgroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "discount_code_key" ON "discount"("code");

-- CreateIndex
CREATE INDEX "discount_code_idx" ON "discount"("code");

-- CreateIndex
CREATE INDEX "discount_active_idx" ON "discount"("active");

-- CreateIndex
CREATE UNIQUE INDEX "variation_group_name_key" ON "variation_group"("name");

-- CreateIndex
CREATE INDEX "sticker_active_idx" ON "sticker"("active");

-- CreateIndex
CREATE UNIQUE INDEX "sticker_translation_stickerId_language_key" ON "sticker_translation"("stickerId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "group_translation_groupId_language_key" ON "group_translation"("groupId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "subgroup_translation_subgroupId_language_key" ON "subgroup_translation"("subgroupId", "language");

-- CreateIndex
CREATE INDEX "sticker_order_userId_idx" ON "sticker_order"("userId");

-- CreateIndex
CREATE INDEX "sticker_order_status_idx" ON "sticker_order"("status");

-- CreateIndex
CREATE INDEX "sticker_order_orderDate_idx" ON "sticker_order"("orderDate");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_orderId_stickerId_key" ON "order_item"("orderId", "stickerId");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_orderId_customStickerId_key" ON "order_item"("orderId", "customStickerId");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "_groupTosubgroup_B_index" ON "_groupTosubgroup"("B");

-- CreateIndex
CREATE INDEX "_groupTosticker_B_index" ON "_groupTosticker"("B");

-- CreateIndex
CREATE INDEX "_stickerTosubgroup_B_index" ON "_stickerTosubgroup"("B");

-- AddForeignKey
ALTER TABLE "sticker" ADD CONSTRAINT "sticker_variationsGroupId_fkey" FOREIGN KEY ("variationsGroupId") REFERENCES "variation_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sticker_translation" ADD CONSTRAINT "sticker_translation_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES "sticker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_translation" ADD CONSTRAINT "group_translation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subgroup_translation" ADD CONSTRAINT "subgroup_translation_subgroupId_fkey" FOREIGN KEY ("subgroupId") REFERENCES "subgroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sticker_order" ADD CONSTRAINT "sticker_order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sticker_order" ADD CONSTRAINT "sticker_order_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sticker_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_stickerId_fkey" FOREIGN KEY ("stickerId") REFERENCES "sticker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_customStickerId_fkey" FOREIGN KEY ("customStickerId") REFERENCES "custom_sticker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_groupTosubgroup" ADD CONSTRAINT "_groupTosubgroup_A_fkey" FOREIGN KEY ("A") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_groupTosubgroup" ADD CONSTRAINT "_groupTosubgroup_B_fkey" FOREIGN KEY ("B") REFERENCES "subgroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_groupTosticker" ADD CONSTRAINT "_groupTosticker_A_fkey" FOREIGN KEY ("A") REFERENCES "group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_groupTosticker" ADD CONSTRAINT "_groupTosticker_B_fkey" FOREIGN KEY ("B") REFERENCES "sticker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_stickerTosubgroup" ADD CONSTRAINT "_stickerTosubgroup_A_fkey" FOREIGN KEY ("A") REFERENCES "sticker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_stickerTosubgroup" ADD CONSTRAINT "_stickerTosubgroup_B_fkey" FOREIGN KEY ("B") REFERENCES "subgroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
