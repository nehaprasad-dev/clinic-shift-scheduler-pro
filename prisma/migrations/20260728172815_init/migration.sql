-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "appRole" TEXT NOT NULL,
    "profession" TEXT,
    "legacyStaffId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyShiftId" INTEGER,
    "date" DATETIME NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "endMinutes" INTEGER NOT NULL,
    "endsNextDay" BOOLEAN NOT NULL DEFAULT false,
    "requiredDoctors" INTEGER NOT NULL DEFAULT 0,
    "requiredNurses" INTEGER NOT NULL DEFAULT 0,
    "requiredReceptionists" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shiftId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Claim_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "acceptedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "mergedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ImportReportItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "rawRow" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    CONSTRAINT "ImportReportItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ImportReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyStaffId_key" ON "User"("legacyStaffId");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_legacyShiftId_key" ON "Shift"("legacyShiftId");

-- CreateIndex
CREATE INDEX "Shift_date_idx" ON "Shift"("date");

-- CreateIndex
CREATE INDEX "Claim_userId_idx" ON "Claim"("userId");

-- CreateIndex
CREATE INDEX "Claim_shiftId_idx" ON "Claim"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_shiftId_userId_key" ON "Claim"("shiftId", "userId");

-- CreateIndex
CREATE INDEX "ImportReportItem_reportId_idx" ON "ImportReportItem"("reportId");
