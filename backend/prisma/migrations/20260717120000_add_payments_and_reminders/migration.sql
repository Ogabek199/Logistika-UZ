-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "adminId" TEXT,
    "documentKind" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TelegramReminderLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramReminderLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Payment_driverId_idx" ON "Payment"("driverId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_documentKind_documentId_idx" ON "Payment"("documentKind", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramReminderLog_fingerprint_key" ON "TelegramReminderLog"("fingerprint");

-- CreateIndex
CREATE INDEX "TelegramReminderLog_driverId_idx" ON "TelegramReminderLog"("driverId");

-- CreateIndex
CREATE INDEX "TelegramReminderLog_kind_idx" ON "TelegramReminderLog"("kind");
