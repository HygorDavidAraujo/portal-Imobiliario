/*
  Warnings:

  - Added the required column `imovelTitulo` to the `leads` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "imovelTitulo" TEXT NOT NULL;
