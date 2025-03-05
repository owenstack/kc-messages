-- CreateTable
CREATE TABLE "TelegramSession" (
    "id" SERIAL NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "sessionString" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "TelegramSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSession_sessionToken_key" ON "TelegramSession"("sessionToken");
