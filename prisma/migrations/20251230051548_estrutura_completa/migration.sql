/*
  Warnings:

  - You are about to drop the `Lead` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_imovelId_fkey";

-- DropTable
DROP TABLE "Lead";

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "nomeCliente" TEXT NOT NULL,
    "telefoneCliente" TEXT NOT NULL,
    "emailCliente" TEXT NOT NULL,
    "visualizado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_imovelId_idx" ON "leads"("imovelId");

-- CreateIndex
CREATE INDEX "leads_visualizado_idx" ON "leads"("visualizado");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
