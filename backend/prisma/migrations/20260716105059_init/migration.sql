-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicle" TEXT,
    "plateNumber" TEXT,
    "passwordHash" TEXT NOT NULL,
    "passportSeries" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Putyovka" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "trailerNo" TEXT,
    "code" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "paid" REAL NOT NULL DEFAULT 0,
    "months" INTEGER,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Putyovka_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tir" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "tirNumber" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "paid" REAL NOT NULL DEFAULT 0,
    "months" INTEGER,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tir_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dazvol" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "country" TEXT,
    "dazvolNumber" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "paid" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dazvol_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "paid" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "License_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT NOT NULL,
    "address" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "paid" REAL NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Rental_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driverId" TEXT,
    "adminId" TEXT,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "note" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Expense_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Expense_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_phone_key" ON "Driver"("phone");

-- CreateIndex
CREATE INDEX "Putyovka_driverId_idx" ON "Putyovka"("driverId");

-- CreateIndex
CREATE INDEX "Putyovka_endDate_idx" ON "Putyovka"("endDate");

-- CreateIndex
CREATE INDEX "Tir_driverId_idx" ON "Tir"("driverId");

-- CreateIndex
CREATE INDEX "Tir_endDate_idx" ON "Tir"("endDate");

-- CreateIndex
CREATE INDEX "Dazvol_driverId_idx" ON "Dazvol"("driverId");

-- CreateIndex
CREATE INDEX "Dazvol_endDate_idx" ON "Dazvol"("endDate");

-- CreateIndex
CREATE INDEX "License_driverId_idx" ON "License"("driverId");

-- CreateIndex
CREATE INDEX "License_endDate_idx" ON "License"("endDate");

-- CreateIndex
CREATE INDEX "Rental_driverId_idx" ON "Rental"("driverId");

-- CreateIndex
CREATE INDEX "Rental_endDate_idx" ON "Rental"("endDate");

-- CreateIndex
CREATE INDEX "Expense_driverId_idx" ON "Expense"("driverId");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");
