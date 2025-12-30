/*
  Warnings:

  - You are about to drop the `Imovel` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_imovelId_fkey";

-- DropTable
DROP TABLE "Imovel";

-- CreateTable
CREATE TABLE "imoveis" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "endereco_logradouro" TEXT,
    "endereco_numero" TEXT,
    "endereco_bairro" TEXT,
    "endereco_cidade" TEXT,
    "endereco_estado" TEXT,
    "endereco_cep" TEXT,
    "endereco_complemento" TEXT,
    "quartos" INTEGER,
    "suites" INTEGER,
    "banheiros" INTEGER,
    "vagasGaragem" INTEGER,
    "areaTotal" DOUBLE PRECISION,
    "areaConstruida" DOUBLE PRECISION,
    "anoConstructao" INTEGER,
    "mobiliado" BOOLEAN NOT NULL DEFAULT false,
    "valorIptu" DOUBLE PRECISION,
    "valorItu" DOUBLE PRECISION,
    "escritorio" BOOLEAN NOT NULL DEFAULT false,
    "lavabo" BOOLEAN NOT NULL DEFAULT false,
    "despensa" BOOLEAN NOT NULL DEFAULT false,
    "areaServico" BOOLEAN NOT NULL DEFAULT false,
    "jardim" BOOLEAN NOT NULL DEFAULT false,
    "varandaGourmet" BOOLEAN NOT NULL DEFAULT false,
    "piscinaPrivativa" BOOLEAN NOT NULL DEFAULT false,
    "churrasqueiraPrivativa" BOOLEAN NOT NULL DEFAULT false,
    "numeroApartamento" TEXT,
    "andar" TEXT,
    "blocoTorre" TEXT,
    "nomeEmpreendimento" TEXT,
    "elevador" BOOLEAN,
    "fachada" TEXT,
    "nomeEmpreendimentoLote" TEXT,
    "quadraLote" TEXT,
    "loteLote" TEXT,
    "valorCondominio" DOUBLE PRECISION,
    "seguranca24h" BOOLEAN NOT NULL DEFAULT false,
    "portaria" BOOLEAN NOT NULL DEFAULT false,
    "elevadorCondominio" BOOLEAN NOT NULL DEFAULT false,
    "quadraEsportiva" BOOLEAN NOT NULL DEFAULT false,
    "piscina" BOOLEAN NOT NULL DEFAULT false,
    "salaoDeFestas" BOOLEAN NOT NULL DEFAULT false,
    "churrasqueira" BOOLEAN NOT NULL DEFAULT false,
    "playground" BOOLEAN NOT NULL DEFAULT false,
    "academia" BOOLEAN NOT NULL DEFAULT false,
    "vagasVisitante" BOOLEAN NOT NULL DEFAULT false,
    "salaCinema" BOOLEAN NOT NULL DEFAULT false,
    "hortaComunitaria" BOOLEAN NOT NULL DEFAULT false,
    "areaGourmetChurrasqueira" BOOLEAN NOT NULL DEFAULT false,
    "miniMercado" BOOLEAN NOT NULL DEFAULT false,
    "portariaRemota" BOOLEAN NOT NULL DEFAULT false,
    "coworking" BOOLEAN NOT NULL DEFAULT false,
    "rio" BOOLEAN NOT NULL DEFAULT false,
    "piscinaRural" BOOLEAN NOT NULL DEFAULT false,
    "represa" BOOLEAN NOT NULL DEFAULT false,
    "lago" BOOLEAN NOT NULL DEFAULT false,
    "curral" BOOLEAN NOT NULL DEFAULT false,
    "estabulo" BOOLEAN NOT NULL DEFAULT false,
    "galinheiro" BOOLEAN NOT NULL DEFAULT false,
    "pocilga" BOOLEAN NOT NULL DEFAULT false,
    "silo" BOOLEAN NOT NULL DEFAULT false,
    "terraceamento" BOOLEAN NOT NULL DEFAULT false,
    "energia" BOOLEAN NOT NULL DEFAULT false,
    "agua" BOOLEAN NOT NULL DEFAULT false,
    "acessoAsfalto" BOOLEAN NOT NULL DEFAULT false,
    "casariao" BOOLEAN NOT NULL DEFAULT false,
    "areaAlqueires" DOUBLE PRECISION,
    "tipoAlqueire" TEXT,
    "valorItr" DOUBLE PRECISION,
    "tipoVenda" TEXT,
    "aceitaPermuta" BOOLEAN NOT NULL DEFAULT false,
    "aceitaFinanciamento" BOOLEAN NOT NULL DEFAULT false,
    "fotos" TEXT NOT NULL DEFAULT '[]',
    "nomeDono" TEXT,
    "cpfDono" TEXT,
    "telefoneDono" TEXT,
    "emailDono" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imoveis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "imoveis_categoria_idx" ON "imoveis"("categoria");

-- CreateIndex
CREATE INDEX "imoveis_tipo_idx" ON "imoveis"("tipo");

-- CreateIndex
CREATE INDEX "imoveis_ativo_idx" ON "imoveis"("ativo");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_imovelId_fkey" FOREIGN KEY ("imovelId") REFERENCES "imoveis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
