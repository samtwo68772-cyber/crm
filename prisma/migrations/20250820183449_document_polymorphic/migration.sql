/*
  Warnings:

  - You are about to drop the column `linkedToId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `linkedToType` on the `Document` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_linkedToId_account_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_linkedToId_case_fkey";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "linkedToId",
DROP COLUMN "linkedToType",
ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "caseId" TEXT;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;
