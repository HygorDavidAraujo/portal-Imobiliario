import { PrismaClient } from '@prisma/client';
console.log('🐘 Inicializando Prisma Client para PostgreSQL...');
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
export const initializeDatabase = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Conexão com o banco de dados via Prisma estabelecida com sucesso.');
    }
    catch (error) {
        console.error('❌ Não foi possível conectar ao banco de dados via Prisma:', error);
        throw error;
    }
};
// ==================================================================================
// Camada de Compatibilidade (emulação do better-sqlite3) para Prisma
// ==================================================================================
// Mapeia os nomes das colunas do banco para os nomes dos campos no Prisma
// Ex: endereco_logradouro -> endereco_logradouro
const columnMappings = {
    id: 'id',
    titulo: 'titulo',
    descricao: 'descricao',
    categoria: 'categoria',
    tipo: 'tipo',
    preco: 'preco',
    ativo: 'ativo',
    endereco_logradouro: 'endereco_logradouro',
    endereco_numero: 'endereco_numero',
    endereco_bairro: 'endereco_bairro',
    endereco_cidade: 'endereco_cidade',
    endereco_estado: 'endereco_estado',
    endereco_cep: 'endereco_cep',
    endereco_complemento: 'endereco_complemento',
    quartos: 'quartos',
    suites: 'suites',
    banheiros: 'banheiros',
    vagasGaragem: 'vagasGaragem',
    areaTotal: 'areaTotal',
    areaConstruida: 'areaConstruida',
    anoConstructao: 'anoConstructao',
    mobiliado: 'mobiliado',
    valorIptu: 'valorIptu',
    valorItu: 'valorItu',
    escritorio: 'escritorio',
    lavabo: 'lavabo',
    despensa: 'despensa',
    areaServico: 'areaServico',
    jardim: 'jardim',
    varandaGourmet: 'varandaGourmet',
    piscinaPrivativa: 'piscinaPrivativa',
    churrasqueiraPrivativa: 'churrasqueiraPrivativa',
    numeroApartamento: 'numeroApartamento',
    andar: 'andar',
    blocoTorre: 'blocoTorre',
    nomeEmpreendimento: 'nomeEmpreendimento',
    elevador: 'elevador',
    fachada: 'fachada',
    nomeEmpreendimentoLote: 'nomeEmpreendimentoLote',
    quadraLote: 'quadraLote',
    loteLote: 'loteLote',
    valorCondominio: 'valorCondominio',
    seguranca24h: 'seguranca24h',
    portaria: 'portaria',
    elevadorCondominio: 'elevadorCondominio',
    quadraEsportiva: 'quadraEsportiva',
    piscina: 'piscina',
    salaoDeFestas: 'salaoDeFestas',
    churrasqueira: 'churrasqueira',
    playground: 'playground',
    academia: 'academia',
    vagasVisitante: 'vagasVisitante',
    salaCinema: 'salaCinema',
    hortaComunitaria: 'hortaComunitaria',
    areaGourmetChurrasqueira: 'areaGourmetChurrasqueira',
    miniMercado: 'miniMercado',
    portariaRemota: 'portariaRemota',
    coworking: 'coworking',
    rio: 'rio',
    piscinaRural: 'piscinaRural',
    represa: 'represa',
    lago: 'lago',
    curral: 'curral',
    estabulo: 'estabulo',
    galinheiro: 'galinheiro',
    pocilga: 'pocilga',
    silo: 'silo',
    terraceamento: 'terraceamento',
    energia: 'energia',
    agua: 'agua',
    acessoAsfalto: 'acessoAsfalto',
    casariao: 'casariao',
    areaAlqueires: 'areaAlqueires',
    tipoAlqueire: 'tipoAlqueire',
    valorItr: 'valorItr',
    tipoVenda: 'tipoVenda',
    aceitaPermuta: 'aceitaPermuta',
    aceitaFinanciamento: 'aceitaFinanciamento',
    fotos: 'fotos',
    nomeDono: 'nomeDono',
    cpfDono: 'cpfDono',
    telefoneDono: 'telefoneDono',
    emailDono: 'emailDono',
    criadoEm: 'criadoEm',
    imovelId: 'imovelId',
    imovelTitulo: 'imovelTitulo',
    clienteNome: 'nomeCliente',
    clienteEmail: 'emailCliente',
    clienteTelefone: 'telefoneCliente',
    mensagem: 'mensagem',
    visualizado: 'visualizado'
};
const prepare = (sql) => {
    // Simplistic parser to determine the operation type and table
    const upperSql = sql.trim().toUpperCase();
    const get = async (...params) => {
        if (upperSql.startsWith('SELECT * FROM IMOVEIS WHERE ID = ?')) {
            return prisma.imovel.findUnique({ where: { id: params[0] } });
        }
        if (upperSql.includes("SELECT ID FROM IMOVEIS WHERE ID LIKE '")) {
            const match = sql.match(/'([^']*)%'/);
            const prefix = match ? match[1] : null;
            if (!prefix) {
                console.warn('Prisma compatibility layer: Could not extract prefix from query', sql);
                return null;
            }
            return prisma.imovel.findFirst({
                where: { id: { startsWith: prefix } },
                orderBy: { id: 'desc' },
                select: { id: true },
            });
        }
        // Add other GET cases if necessary
        console.warn('Prisma compatibility layer: Unhandled GET query', sql);
        return null;
    };
    const all = async (...params) => {
        if (upperSql.startsWith('SELECT * FROM IMOVEIS')) {
            const where = upperSql.includes('WHERE ATIVO = ?') ? { ativo: params[0] } : {};
            return prisma.imovel.findMany({
                where,
                orderBy: { criadoEm: 'desc' },
            });
        }
        if (upperSql.startsWith('SELECT * FROM LEADS')) {
            return prisma.lead.findMany({
                orderBy: { criadoEm: 'desc' },
                include: { imovel: { select: { titulo: true } } }
            });
        }
        // Add other ALL cases if necessary
        console.warn('Prisma compatibility layer: Unhandled ALL query', sql);
        return [];
    };
    const run = async (...params) => {
        if (upperSql.startsWith('INSERT INTO IMOVEIS')) {
            const data = {
                id: params[0], titulo: params[1], descricao: params[2], categoria: params[3], tipo: params[4], preco: params[5], ativo: params[6],
                endereco_logradouro: params[7], endereco_numero: params[8], endereco_bairro: params[9], endereco_cidade: params[10], endereco_estado: params[11], endereco_cep: params[12], endereco_complemento: params[13],
                quartos: params[14], suites: params[15], banheiros: params[16], vagasGaragem: params[17], areaTotal: params[18], areaConstruida: params[19], anoConstructao: params[20], mobiliado: params[21], valorIptu: params[22], valorItu: params[23],
                escritorio: params[24], lavabo: params[25], despensa: params[26], areaServico: params[27], jardim: params[28], varandaGourmet: params[29], piscinaPrivativa: params[30], churrasqueiraPrivativa: params[31],
                numeroApartamento: params[32], andar: params[33], blocoTorre: params[34], nomeEmpreendimento: params[35], elevador: params[36], fachada: params[37],
                nomeEmpreendimentoLote: params[38], quadraLote: params[39], loteLote: params[40],
                valorCondominio: params[41], seguranca24h: params[42], portaria: params[43], elevadorCondominio: params[44], quadraEsportiva: params[45], piscina: params[46], salaoDeFestas: params[47], churrasqueira: params[48], playground: params[49], academia: params[50], vagasVisitante: params[51], salaCinema: params[52], hortaComunitaria: params[53], areaGourmetChurrasqueira: params[54], miniMercado: params[55], portariaRemota: params[56], coworking: params[57],
                rio: params[58], piscinaRural: params[59], represa: params[60], lago: params[61], curral: params[62], estabulo: params[63], galinheiro: params[64], pocilga: params[65], silo: params[66], terraceamento: params[67], energia: params[68], agua: params[69], acessoAsfalto: params[70], casariao: params[71], areaAlqueires: params[72], tipoAlqueire: params[73], valorItr: params[74],
                tipoVenda: params[75], aceitaPermuta: params[76], aceitaFinanciamento: params[77],
                fotos: params[78], nomeDono: params[79], cpfDono: params[80], telefoneDono: params[81], emailDono: params[82],
            };
            return prisma.imovel.create({ data });
        }
        if (upperSql.startsWith('UPDATE IMOVEIS')) {
            const data = {
                titulo: params[0], descricao: params[1], categoria: params[2], tipo: params[3], preco: params[4], ativo: params[5],
                endereco_logradouro: params[6], endereco_numero: params[7], endereco_bairro: params[8], endereco_cidade: params[9], endereco_estado: params[10], endereco_cep: params[11], endereco_complemento: params[12],
                quartos: params[13], suites: params[14], banheiros: params[15], vagasGaragem: params[16], areaTotal: params[17], areaConstruida: params[18], anoConstructao: params[19], mobiliado: params[20], valorIptu: params[21], valorItu: params[22],
                escritorio: params[23], lavabo: params[24], despensa: params[25], areaServico: params[26], jardim: params[27], varandaGourmet: params[28], piscinaPrivativa: params[29], churrasqueiraPrivativa: params[30],
                numeroApartamento: params[31], andar: params[32], blocoTorre: params[33], nomeEmpreendimento: params[34], elevador: params[35], fachada: params[36],
                nomeEmpreendimentoLote: params[37], quadraLote: params[38], loteLote: params[39],
                valorCondominio: params[40], seguranca24h: params[41], portaria: params[42], elevadorCondominio: params[43], quadraEsportiva: params[44], piscina: params[45], salaoDeFestas: params[46], churrasqueira: params[47], playground: params[48], academia: params[49], vagasVisitante: params[50], salaCinema: params[51], hortaComunitaria: params[52], areaGourmetChurrasqueira: params[53], miniMercado: params[54], portariaRemota: params[55], coworking: params[56],
                rio: params[57], piscinaRural: params[58], represa: params[59], lago: params[60], curral: params[61], estabulo: params[62], galinheiro: params[63], pocilga: params[64], silo: params[65], terraceamento: params[66], energia: params[67], agua: params[68], acessoAsfalto: params[69], casariao: params[70], areaAlqueires: params[71], tipoAlqueire: params[72], valorItr: params[73],
                tipoVenda: params[74], aceitaPermuta: params[75], aceitaFinanciamento: params[76],
                fotos: params[77], nomeDono: params[78], cpfDono: params[79], telefoneDono: params[80], emailDono: params[81],
            };
            const id = params[82];
            return prisma.imovel.update({ where: { id }, data });
        }
        if (upperSql.startsWith('DELETE FROM IMOVEIS')) {
            return prisma.imovel.delete({ where: { id: params[0] } });
        }
        if (upperSql.startsWith('INSERT INTO LEADS')) {
            const data = {
                id: params[0],
                imovelId: params[1],
                imovelTitulo: params[2],
                nomeCliente: params[3],
                emailCliente: params[4],
                telefoneCliente: params[5],
            };
            return prisma.lead.create({ data });
        }
        if (upperSql.startsWith('UPDATE LEADS')) {
            return prisma.lead.update({
                where: { id: params[1] },
                data: { visualizado: params[0] }
            });
        }
        // Add other RUN cases if necessary
        console.warn('Prisma compatibility layer: Unhandled RUN query', sql);
        return null;
    };
    return { get, all, run };
};
const db = {
    prepare,
    prisma,
};
// Exporta o objeto 'db' compatível para ser usado no index.js
export default db;
