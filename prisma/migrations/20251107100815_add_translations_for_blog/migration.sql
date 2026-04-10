-- CreateTable
CREATE TABLE "blog_post" (
    "id" TEXT NOT NULL,
    "author" VARCHAR NOT NULL,
    "writingDate" TIMESTAMPTZ(6) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "blog_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_translation" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "title" VARCHAR NOT NULL,
    "htmlContent" TEXT NOT NULL,

    CONSTRAINT "blog_post_translation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_image" (
    "id" TEXT NOT NULL,
    "url" VARCHAR NOT NULL,
    "altText" VARCHAR,
    "blogPostId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_link" (
    "id" TEXT NOT NULL,
    "url" VARCHAR NOT NULL,
    "title" VARCHAR NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_post_active_idx" ON "blog_post"("active");

-- CreateIndex
CREATE INDEX "blog_post_writingDate_idx" ON "blog_post"("writingDate");

-- CreateIndex
CREATE INDEX "blog_post_translation_blogPostId_idx" ON "blog_post_translation"("blogPostId");

-- CreateIndex
CREATE INDEX "blog_post_translation_language_idx" ON "blog_post_translation"("language");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_translation_blogPostId_language_key" ON "blog_post_translation"("blogPostId", "language");

-- CreateIndex
CREATE INDEX "blog_image_blogPostId_idx" ON "blog_image"("blogPostId");

-- CreateIndex
CREATE INDEX "blog_link_blogPostId_idx" ON "blog_link"("blogPostId");

-- AddForeignKey
ALTER TABLE "blog_post_translation" ADD CONSTRAINT "blog_post_translation_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_image" ADD CONSTRAINT "blog_image_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_link" ADD CONSTRAINT "blog_link_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "blog_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
