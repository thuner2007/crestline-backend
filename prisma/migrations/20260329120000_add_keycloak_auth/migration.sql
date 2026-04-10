-- CreateEnum
CREATE TYPE "auth_provider_enum" AS ENUM ('legacy', 'keycloak', 'both');

-- AlterTable
ALTER TABLE "user" ADD COLUMN "keycloakSub" VARCHAR(255),
ADD COLUMN "authProvider" "auth_provider_enum" NOT NULL DEFAULT 'legacy';

-- CreateIndex
CREATE UNIQUE INDEX "user_keycloakSub_key" ON "user"("keycloakSub");
