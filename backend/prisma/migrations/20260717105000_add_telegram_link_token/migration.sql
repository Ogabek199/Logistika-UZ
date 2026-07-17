-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "telegramLinkToken" TEXT;
ALTER TABLE "Driver" ADD COLUMN "telegramLinkedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_telegramLinkToken_key" ON "Driver"("telegramLinkToken");
