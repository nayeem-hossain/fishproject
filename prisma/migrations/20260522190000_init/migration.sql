-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "mobileNo" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subProject" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "chequeNumber" TEXT NOT NULL,
    "guarantorName" TEXT NOT NULL,
    "deedFileUrl" TEXT NOT NULL,
    "guarantorChequeFileUrl" TEXT NOT NULL,
    "nidFileUrl" TEXT NOT NULL,
    "tradeLicenseFileUrl" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "subProject" TEXT NOT NULL,
    "fishQuantity" INTEGER NOT NULL,
    "sizeMon" DECIMAL(18,6) NOT NULL,
    "totalWeightKg" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedLog" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "openingBalance" DECIMAL(18,3) NOT NULL,
    "additionAmount" DECIMAL(18,3) NOT NULL,
    "dailyUse" DECIMAL(18,3) NOT NULL,
    "closingBalance" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "FeedLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");

-- CreateIndex
CREATE INDEX "Inventory_projectId_idx" ON "Inventory"("projectId");

-- CreateIndex
CREATE INDEX "FeedLog_projectId_idx" ON "FeedLog"("projectId");

-- CreateIndex
CREATE INDEX "FeedLog_entryDate_idx" ON "FeedLog"("entryDate");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedLog" ADD CONSTRAINT "FeedLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;