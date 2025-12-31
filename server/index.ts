import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

// Escolhe o banco baseado na variável de ambiente
let db, initializeDatabase;

if (process.env.DATABASE_URL) {
  // PostgreSQL (produção Railway)
  console.log('🐘 Usando PostgreSQL');
  const dbModule = await import('./database-postgres.js');
  db = dbModule.default;
  db.prisma = dbModule.prisma; // Make prisma client available
  initializeDatabase = dbModule.initializeDatabase;
} else {
  // SQLite (desenvolvimento local)
  console.log('📁 Usando SQLite');
  try {
    const dbModule = await import('./database.js');
    db = dbModule.default;
    initializeDatabase = dbModule.initializeDatabase;
  } catch (error) {
    console.error('⚠️  SQLite não disponível. Use PostgreSQL em produção.');
    throw new Error('Configure DATABASE_URL para usar PostgreSQL');
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// CORS configurado para produção
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://portal-imobiliario-production.up.railway.app',
  'https://portal-imobiliario-vert.vercel.app',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL
].filter(Boolean);

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permite requisições sem 'origin' (ex: apps mobile, Postman) ou se a origem estiver na lista.
    if (!origin || allowedOrigins.some(allowed => allowed && origin.includes(allowed))) {
      return callback(null, true);
    }
    // Bloqueia outras origens
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Inicializar banco de dados
console.log('🔧 Inicializando banco de dados...');
try {
  await initializeDatabase();
  console.log('✅ Banco de dados inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar banco:', error);
  // Não pare o servidor, apenas logue o erro
}

const requiredEnv = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.warn(`Variáveis ausentes: ${missing.join(', ')}. O envio de e-mail não funcionará sem elas.`);
}

const mailPort = Number(process.env.MAIL_PORT) || 587;
const mailSecure = typeof process.env.MAIL_SECURE !== 'undefined'
  ? String(process.env.MAIL_SECURE).toLowerCase() === 'true'
  : mailPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: mailPort,
  secure: mailSecure,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: Number(process.env.MAIL_CONNECTION_TIMEOUT) || 15000,
  greetingTimeout: Number(process.env.MAIL_GREETING_TIMEOUT) || 10000,
  socketTimeout: Number(process.env.MAIL_SOCKET_TIMEOUT) || 20000,
  tls: {
    // Evita falhas por SNI/CA em provedores comuns
    rejectUnauthorized: false,
  },
});

// Mapeia linha do banco (flat) para objeto Imovel do frontend (aninhado)
const mapRowToImovel = (row: any) => ({
  id: row.id,
  categoria: row.categoria,
  tipo: row.tipo,
  titulo: row.titulo,
  descricao: row.descricao,
  preco: Number(row.preco || 0),
  endereco: {
    logradouro: row.endereco_logradouro || '',
    numero: row.endereco_numero || '',
    complemento: row.endereco_complemento || '',
    bairro: row.endereco_bairro || '',
    cidade: row.endereco_cidade || '',
    estado: row.endereco_estado || '',
    cep: row.endereco_cep || '',
  },
  dadosApartamento: {
    numeroApartamento: row.numeroApartamento || '',
    andar: row.andar || '',
    blocoTorre: row.blocoTorre || '',
    nomeEmpreendimento: row.nomeEmpreendimento || '',
    elevador: !!row.elevador,
    fachada: row.fachada || '',
  },
  dadosLoteCondominio: {
    nomeEmpreendimento: row.nomeEmpreendimentoLote || '',
    quadra: row.quadraLote || '',
    lote: row.loteLote || '',
  },
  dadosCondominio: {
    valorCondominio: row.valorCondominio != null ? Number(row.valorCondominio) : undefined,
    seguranca24h: !!row.seguranca24h,
    portaria: !!row.portaria,
    elevador: !!row.elevadorCondominio,
    quadraEsportiva: !!row.quadraEsportiva,
    piscina: !!row.piscina,
    salaoDeFestas: !!row.salaoDeFestas,
    churrasqueira: !!row.churrasqueira,
    playground: !!row.playground,
    academia: !!row.academia,
    vagasVisitante: !!row.vagasVisitante,
    salaCinema: !!row.salaCinema,
    hortaComunitaria: !!row.hortaComunitaria,
    areaGourmetChurrasqueira: !!row.areaGourmetChurrasqueira,
    miniMercado: !!row.miniMercado,
    portariaRemota: !!row.portariaRemota,
    coworking: !!row.coworking,
  },
  dadosRural: {
    rio: !!row.rio,
    piscina: !!row.piscinaRural,
    represa: !!row.represa,
    lago: !!row.lago,
    curral: !!row.curral,
    estabulo: !!row.estabulo,
    galinheiro: !!row.galinheiro,
    pocilga: !!row.pocilga,
    silo: !!row.silo,
    terraceamento: !!row.terraceamento,
    energia: !!row.energia,
    agua: !!row.agua,
    acessoAsfalto: !!row.acessoAsfalto,
    casariao: !!row.casariao,
    areaAlqueires: row.areaAlqueires != null ? Number(row.areaAlqueires) : undefined,
    tipoAlqueire: row.tipoAlqueire || undefined,
    valorItr: row.valorItr != null ? Number(row.valorItr) : undefined,
  },
  fichaTecnica: {
    areaTotal: row.areaTotal != null ? Number(row.areaTotal) : undefined,
    areaConstruida: row.areaConstruida != null ? Number(row.areaConstruida) : undefined,
    quartos: row.quartos != null ? Number(row.quartos) : undefined,
    suites: row.suites != null ? Number(row.suites) : undefined,
    banheiros: row.banheiros != null ? Number(row.banheiros) : undefined,
    vagasGaragem: row.vagasGaragem != null ? Number(row.vagasGaragem) : undefined,
    anoConstructao: row.anoConstructao != null ? Number(row.anoConstructao) : undefined,
    mobiliado: !!row.mobiliado,
    escritorio: !!row.escritorio,
    lavabo: !!row.lavabo,
    despensa: !!row.despensa,
    areaServico: !!row.areaServico,
    jardim: !!row.jardim,
    varandaGourmet: !!row.varandaGourmet,
    piscinaPrivativa: !!row.piscinaPrivativa,
    churrasqueiraPrivativa: !!row.churrasqueiraPrivativa,
    valorIptu: row.valorIptu != null ? Number(row.valorIptu) : undefined,
    valorItu: row.valorItu != null ? Number(row.valorItu) : undefined,
  },
  tipologia: {
    tipoVenda: row.tipoVenda || 'Venda',
    aceitaPermuta: !!row.aceitaPermuta,
    aceitaFinanciamento: !!row.aceitaFinanciamento,
  },
  fotos: (() => {
    try { return JSON.parse(row.fotos || '[]'); } catch { return []; }
  })(),
  proprietario: {
    nome: row.nomeDono || '',
    telefone: row.telefoneDono || '',
    email: row.emailDono || '',
    cpf: row.cpfDono || '',
  },
  dataCadastro: row.criadoEm ? new Date(row.criadoEm) : new Date(),
  ativo: !!row.ativo,
});

// Normaliza linha de lead para o formato esperado no frontend
// Atenção: no PostgreSQL, identificadores não-quoted são convertidos para minúsculas
// Ex.: clienteNome -> clientenome, imovelId -> imovelid
const mapRowToLead = (row: any) => {
  const id = String(row.id || '');
  const imovelId = String(row.imovelId || row.imovelid || '');
  const imovelTitulo = String(row.imovelTitulo || row.imoveltitulo || row.titulo || '');
  // Corrigir para pegar nome, email e telefone do lead, independente do nome do campo
  const clienteNome = String(row.clienteNome || row.nomeCliente || row.clientenome || row.nome || '');
  const clienteEmail = String(row.clienteEmail || row.emailCliente || row.clienteemail || row.emailCliente || row.email || '');
  const clienteTelefone = String(row.clienteTelefone || row.telefoneCliente || row.clientetelefone || row.telefoneCliente || row.telefone || '');
  const mensagem = String((row.mensagem ?? '') || '');
  const created = row.data || row.criadoEm || row.criadoem;
  const data = created ? new Date(created) : new Date();

  return {
    id,
    imovelId,
    imovelTitulo,
    cliente: {
      nome: clienteNome,
      email: clienteEmail,
      telefone: clienteTelefone,
    },
    mensagem,
    data,
    visualizado: !!(row.visualizado ?? row.visualizado),
  };
};

// Mapeia tipo do imóvel para prefixo de ID
const obterPrefixoTipo = (tipo: string) => {
  const mapeamento: { [key: string]: string } = {
    'Casa': 'CA',
    'Apartamento': 'AP',
    'Sobrado': 'SO',
    'Lote': 'LO',
    'Chácara': 'CH',
    'Fazenda': 'FZ',
    'Sítio': 'SI',
    'Terreno': 'TE',
    'Prédio Comercial': 'PC',
    'Sala Comercial': 'SC',
    'Loja': 'LJ',
    'Galpão': 'GA',
    'Ponto Comercial': 'PT',
    'Casa em Condomínio': 'CC',
    'Lote em Condomínio': 'LC',
    'Kitnet': 'KT',
    'Studio': 'ST',
    'Cobertura': 'CO',
  };
  return mapeamento[tipo] || 'IM';
};

// Gera próximo ID sequencial para o tipo de imóvel
const gerarProximoId = async (tipo: string) => {
  const prefixo = obterPrefixoTipo(tipo);
  
    if (!db.prisma) throw new Error('Prisma client não está disponível. Verifique a configuração do banco de dados.');
    const ultimoImovel = await db.prisma.imovel.findFirst({
      where: { id: { startsWith: prefixo } },
      orderBy: { id: 'desc' },
      select: { id: true },
    });
  
  if (!ultimoImovel) {
    // Primeiro imóvel deste tipo
    return `${prefixo}001`;
  }
  
  // Extrai o número do último ID e incrementa
  const ultimoNumero = parseInt(ultimoImovel.id.substring(prefixo.length)) || 0;
  const proximoNumero = ultimoNumero + 1;
  const numeroFormatado = String(proximoNumero).padStart(3, '0');
  
  return `${prefixo}${numeroFormatado}`;
};

app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Verifica apenas se o servidor está rodando
    const dbStatus = process.env.DATABASE_URL ? 'postgresql' : 'sqlite';
    res.json({ 
      status: 'ok', 
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: String(error) });
  }
});

// Rota raiz para verificação rápida
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Portal Imobiliário API',
    status: 'running',
    version: '1.0.0'
  });
});

// ==================== IMÓVEIS ====================

app.get('/api/imoveis', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM imoveis';
    const params = [];

    // Para o admin, mostrar todos. Para o público, apenas ativos.
    if (status !== 'all') {
      query += ' WHERE ativo = ?';
      params.push(true);
    }

    query += ' ORDER BY criadoEm DESC';
    
    const rows = await db.prepare(query).all(...params);
    const mapped = (rows || []).map(mapRowToImovel);
    res.json(mapped);
  } catch (error) {
    console.error('Erro ao buscar imóveis:', error);
    res.status(500).json({ error: 'Erro ao buscar imóveis' });
  }
});

app.get('/api/imoveis/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = await db.prepare('SELECT * FROM imoveis WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }
    res.json(mapRowToImovel(row));
  } catch (error) {
    console.error('Erro ao buscar imóvel:', error);
    res.status(500).json({ error: 'Erro ao buscar imóvel' });
  }
});

app.post('/api/imoveis', async (req: Request, res: Response) => {
  try {
    const imovel = req.body;

    // --- Validação ---
    const camposObrigatorios = ['titulo', 'categoria', 'tipo', 'preco'];
    const camposFaltantes = camposObrigatorios.filter(campo => 
      imovel[campo] === null || imovel[campo] === undefined || imovel[campo] === ''
    );

    if (camposFaltantes.length > 0) {
      return res.status(400).json({ 
        error: `Campos obrigatórios faltando: ${camposFaltantes.join(', ')}.`,
        detail: `Campos obrigatórios faltando: ${camposFaltantes.join(', ')}.` 
      });
    }
    // --- Fim da Validação ---

    const novoId = await gerarProximoId(imovel.tipo);
    console.log(`📝 Gerando novo imóvel: ${novoId} (${imovel.tipo})`);

    const {
      endereco = {},
      fichaTecnica = {},
      dadosApartamento = {},
      dadosLoteCondominio = {},
      dadosCondominio = {},
      dadosRural = {},
      tipologia = {},
      proprietario = {},
      fotos = [],
    } = imovel;

    const dataToCreate = {
      id: novoId,
      titulo: imovel.titulo,
      descricao: imovel.descricao,
      categoria: imovel.categoria,
      tipo: imovel.tipo,
      preco: imovel.preco,
      ativo: imovel.ativo ?? true,

      // Endereço
      endereco_logradouro: endereco.logradouro,
      endereco_numero: endereco.numero,
      endereco_bairro: endereco.bairro,
      endereco_cidade: endereco.cidade,
      endereco_estado: endereco.estado,
      endereco_cep: endereco.cep,
      endereco_complemento: endereco.complemento,

      // Ficha Técnica
      quartos: fichaTecnica.quartos,
      suites: fichaTecnica.suites,
      banheiros: fichaTecnica.banheiros,
      vagasGaragem: fichaTecnica.vagasGaragem,
      areaTotal: fichaTecnica.areaTotal,
      areaConstruida: fichaTecnica.areaConstruida,
      anoConstructao: fichaTecnica.anoConstructao,
      mobiliado: fichaTecnica.mobiliado,
      valorIptu: fichaTecnica.valorIptu,
      valorItu: fichaTecnica.valorItu,
      escritorio: fichaTecnica.escritorio,
      lavabo: fichaTecnica.lavabo,
      despensa: fichaTecnica.despensa,
      areaServico: fichaTecnica.areaServico,
      jardim: fichaTecnica.jardim,
      varandaGourmet: fichaTecnica.varandaGourmet,
      piscinaPrivativa: fichaTecnica.piscinaPrivativa,
      churrasqueiraPrivativa: fichaTecnica.churrasqueiraPrivativa,

      // Dados Apartamento
      numeroApartamento: dadosApartamento.numeroApartamento,
      andar: dadosApartamento.andar,
      blocoTorre: dadosApartamento.blocoTorre,
      nomeEmpreendimento: dadosApartamento.nomeEmpreendimento,
      elevador: dadosApartamento.elevador,
      fachada: dadosApartamento.fachada,
      
      // Dados Lote
      nomeEmpreendimentoLote: dadosLoteCondominio.nomeEmpreendimento,
      quadraLote: dadosLoteCondominio.quadra,
      loteLote: dadosLoteCondominio.lote,

      // Condominio
      valorCondominio: dadosCondominio.valorCondominio,
      seguranca24h: dadosCondominio.seguranca24h,
      portaria: dadosCondominio.portaria,
      elevadorCondominio: dadosCondominio.elevador,
      quadraEsportiva: dadosCondominio.quadraEsportiva,
      piscina: dadosCondominio.piscina,
      salaoDeFestas: dadosCondominio.salaoDeFestas,
      churrasqueira: dadosCondominio.churrasqueira,
      playground: dadosCondominio.playground,
      academia: dadosCondominio.academia,
      vagasVisitante: dadosCondominio.vagasVisitante,
      salaCinema: dadosCondominio.salaCinema,
      hortaComunitaria: dadosCondominio.hortaComunitaria,
      areaGourmetChurrasqueira: dadosCondominio.areaGourmetChurrasqueira,
      miniMercado: dadosCondominio.miniMercado,
      portariaRemota: dadosCondominio.portariaRemota,
      coworking: dadosCondominio.coworking,

      // Rural
      rio: dadosRural.rio,
      piscinaRural: dadosRural.piscina,
      represa: dadosRural.represa,
      lago: dadosRural.lago,
      curral: dadosRural.curral,
      estabulo: dadosRural.estabulo,
      galinheiro: dadosRural.galinheiro,
      pocilga: dadosRural.pocilga,
      silo: dadosRural.silo,
      terraceamento: dadosRural.terraceamento,
      energia: dadosRural.energia,
      agua: dadosRural.agua,
      acessoAsfalto: dadosRural.acessoAsfalto,
      casariao: dadosRural.casariao,
      areaAlqueires: dadosRural.areaAlqueires,
      tipoAlqueire: dadosRural.tipoAlqueire,
      valorItr: dadosRural.valorItr,

      // Tipologia
      tipoVenda: tipologia.tipoVenda,
      aceitaPermuta: tipologia.aceitaPermuta,
      aceitaFinanciamento: tipologia.aceitaFinanciamento,

      // Outros
      fotos: JSON.stringify(fotos || []),
      nomeDono: proprietario.nome,
      cpfDono: proprietario.cpf,
      telefoneDono: proprietario.telefone,
      emailDono: proprietario.email,
    };
    
    // Remove chaves com valor `undefined` para não sobreescrever defaults no Prisma
    Object.keys(dataToCreate).forEach(key => {
        if (dataToCreate[key as keyof typeof dataToCreate] === undefined) {
            delete dataToCreate[key as keyof typeof dataToCreate];
        }
    });

    if (!db.prisma) throw new Error('Prisma client não está disponível. Verifique a configuração do banco de dados.');
    await db.prisma.imovel.create({ data: dataToCreate });

    console.log(`✅ Imóvel criado: ${novoId}`);
    res.json({ id: novoId });
  } catch (error) {
    console.error('Erro detalhado ao criar imóvel:', error);
    let detail = '';
    if (error instanceof Error) {
      detail = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      detail = String((error as any).message);
    } else {
      detail = String(error);
    }
    res.status(500).json({ error: 'Erro ao criar imóvel', detail });
  }
});

app.put('/api/imoveis/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imovel = req.body;
    
    console.log('🔄 Atualizando imóvel ID:', id);
    if (imovel.fichaTecnica) {
      console.log('   Ficha Técnica recebida:', JSON.stringify(imovel.fichaTecnica, null, 2));
    }
    
    const fotosJson = JSON.stringify(imovel.fotos || []);

    const endereco = imovel.endereco || {};
    const fichaTecnica = imovel.fichaTecnica || {};
    const dadosApartamento = imovel.dadosApartamento || {};
    const dadosLoteCondominio = imovel.dadosLoteCondominio || {};
    const dadosCondominio = imovel.dadosCondominio || {};
    const dadosRural = imovel.dadosRural || {};
    const tipologia = imovel.tipologia || {};
    const proprietario = imovel.proprietario || imovel.infoDono || {};

    const stmt = db.prepare(`
      UPDATE imoveis SET
        titulo = ?, descricao = ?, categoria = ?, tipo = ?, preco = ?, ativo = ?,
        endereco_logradouro = ?, endereco_numero = ?, endereco_bairro = ?, endereco_cidade = ?, endereco_estado = ?, endereco_cep = ?, endereco_complemento = ?,
        quartos = ?, suites = ?, banheiros = ?, vagasGaragem = ?, areaTotal = ?, areaConstruida = ?, anoConstructao = ?, mobiliado = ?, valorIptu = ?, valorItu = ?,
        escritorio = ?, lavabo = ?, despensa = ?, areaServico = ?, jardim = ?, varandaGourmet = ?, piscinaPrivativa = ?, churrasqueiraPrivativa = ?,
        numeroApartamento = ?, andar = ?, blocoTorre = ?, nomeEmpreendimento = ?, elevador = ?, fachada = ?,
        nomeEmpreendimentoLote = ?, quadraLote = ?, loteLote = ?,
        valorCondominio = ?, seguranca24h = ?, portaria = ?, elevadorCondominio = ?, quadraEsportiva = ?, piscina = ?, salaoDeFestas = ?, churrasqueira = ?, playground = ?, academia = ?, vagasVisitante = ?, salaCinema = ?, hortaComunitaria = ?, areaGourmetChurrasqueira = ?, miniMercado = ?, portariaRemota = ?, coworking = ?,
        rio = ?, piscinaRural = ?, represa = ?, lago = ?, curral = ?, estabulo = ?, galinheiro = ?, pocilga = ?, silo = ?, terraceamento = ?, energia = ?, agua = ?, acessoAsfalto = ?, casariao = ?, areaAlqueires = ?, tipoAlqueire = ?, valorItr = ?,
        tipoVenda = ?, aceitaPermuta = ?, aceitaFinanciamento = ?,
        fotos = ?, nomeDono = ?, cpfDono = ?, telefoneDono = ?, emailDono = ?
      WHERE id = ?
    `);

    await stmt.run(
      imovel.titulo ?? null, imovel.descricao ?? null, imovel.categoria ?? null, imovel.tipo ?? null, imovel.preco ?? null, imovel.ativo ?? true,
      endereco.logradouro ?? null, endereco.numero ?? null, endereco.bairro ?? null, endereco.cidade ?? null, endereco.estado ?? null, endereco.cep ?? null, endereco.complemento ?? null,
      fichaTecnica.quartos ?? null, fichaTecnica.suites ?? null, fichaTecnica.banheiros ?? null, fichaTecnica.vagasGaragem ?? null, fichaTecnica.areaTotal ?? null, fichaTecnica.areaConstruida ?? null, fichaTecnica.anoConstructao ?? null, fichaTecnica.mobiliado ?? false, fichaTecnica.valorIptu ?? null, fichaTecnica.valorItu ?? null,
      fichaTecnica.escritorio ?? false, fichaTecnica.lavabo ?? false, fichaTecnica.despensa ?? false, fichaTecnica.areaServico ?? false, fichaTecnica.jardim ?? false, fichaTecnica.varandaGourmet ?? false, fichaTecnica.piscinaPrivativa ?? false, fichaTecnica.churrasqueiraPrivativa ?? false,
      dadosApartamento.numeroApartamento ?? null, dadosApartamento.andar ?? null, dadosApartamento.blocoTorre ?? null, dadosApartamento.nomeEmpreendimento ?? null, dadosApartamento.elevador ?? false, dadosApartamento.fachada ?? null,
      dadosLoteCondominio.nomeEmpreendimento ?? null, dadosLoteCondominio.quadra ?? null, dadosLoteCondominio.lote ?? null,
      dadosCondominio.valorCondominio ?? null, dadosCondominio.seguranca24h ?? false, dadosCondominio.portaria ?? false, dadosCondominio.elevador ?? false, dadosCondominio.quadraEsportiva ?? false, dadosCondominio.piscina ?? false, dadosCondominio.salaoDeFestas ?? false, dadosCondominio.churrasqueira ?? false, dadosCondominio.playground ?? false, dadosCondominio.academia ?? false, dadosCondominio.vagasVisitante ?? false, dadosCondominio.salaCinema ?? false, dadosCondominio.hortaComunitaria ?? false, dadosCondominio.areaGourmetChurrasqueira ?? false, dadosCondominio.miniMercado ?? false, dadosCondominio.portariaRemota ?? false, dadosCondominio.coworking ?? false,
      dadosRural.rio ?? false, dadosRural.piscina ?? false, dadosRural.represa ?? false, dadosRural.lago ?? false, dadosRural.curral ?? false, dadosRural.estabulo ?? false, dadosRural.galinheiro ?? false, dadosRural.pocilga ?? false, dadosRural.silo ?? false, dadosRural.terraceamento ?? false, dadosRural.energia ?? false, dadosRural.agua ?? false, dadosRural.acessoAsfalto ?? false, dadosRural.casariao ?? false, dadosRural.areaAlqueires ?? null, dadosRural.tipoAlqueire ?? null, dadosRural.valorItr ?? null,
      tipologia.tipoVenda ?? 'Venda', tipologia.aceitaPermuta ?? false, tipologia.aceitaFinanciamento ?? false,
      fotosJson, proprietario.nome ?? null, proprietario.cpf ?? null, proprietario.telefone ?? null, proprietario.email ?? null,
      id
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar imóvel:', error);
    res.status(500).json({ error: 'Erro ao atualizar imóvel' });
  }
});

app.delete('/api/imoveis/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM imoveis WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao deletar imóvel:', error);
    res.status(500).json({ error: 'Erro ao deletar imóvel' });
  }
});

// ==================== LEADS ====================

app.get('/api/leads', async (_req: Request, res: Response) => {
  try {
    const leads = await db.prepare('SELECT * FROM leads ORDER BY criadoEm DESC').all();
    console.log('📊 GET /api/leads:', leads?.length || 0, 'found');
    if (leads && leads.length > 0) {
      console.log('  Raw lead 0:', leads[0]);
    }
    const mapped = (leads || []).map(mapRowToLead);
    if (mapped.length > 0) {
      console.log('  Mapped lead 0:', mapped[0]);
    }
    res.json(mapped);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

app.post('/api/leads', async (req: Request, res: Response) => {
  try {
    const {
      id,
      imovelId,
      imovelTitulo,
      nomeCliente,
      telefoneCliente,
      emailCliente,
      cliente = {},
    } = req.body || {};

    const nome = nomeCliente || cliente.nome;
    const telefone = telefoneCliente || cliente.telefone;
    const email = emailCliente || cliente.email;
    const titulo = imovelTitulo || req.body?.titulo;

    console.log('📝 Lead POST:', { id, imovelId, titulo, nome, email, telefone });
    if (!id || !imovelId || !titulo || !nome || !telefone || !email) {
      console.error('❌ Missing:', { id: !!id, imovelId: !!imovelId, titulo: !!titulo, nome: !!nome, telefone: !!telefone, email: !!email });
      return res.status(400).json({ error: 'Campos obrigatórios ausentes para lead' });
    }
    const stmt = db.prepare(
      'INSERT INTO leads (id, imovelId, imovelTitulo, clienteNome, clienteEmail, clienteTelefone) VALUES (?, ?, ?, ?, ?, ?)' // Removido campo mensagem
    );
    await stmt.run(id, imovelId, titulo, nome, email, telefone);
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
});

app.patch('/api/leads/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.prepare('UPDATE leads SET visualizado = ? WHERE id = ?').run(true, id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
});

// ==================== E-MAIL ====================

app.post('/api/send-lead', async (req: Request, res: Response) => {
  const { imovelId, imovelTitulo, preco, endereco, contato, link } = req.body || {};

  if (!contato?.nome || !contato?.telefone || !contato?.email || !imovelId || !imovelTitulo) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }

  const to = process.env.MAIL_TO || process.env.MAIL_USER;
  const assunto = `Novo lead - ${imovelTitulo}`;

  const linhasTexto = [
    'Novo lead recebido pelo Portal Imobiliário:',
    '',
    `Imóvel: ${imovelTitulo} (ID: ${imovelId})`,
    preco ? `Preço: ${preco}` : null,
    endereco ? `Localização: ${endereco}` : null,
    link ? `Link: ${link}` : null,
    '',
    'Dados do cliente:',
    `Nome: ${contato.nome}`,
    `Telefone: ${contato.telefone}`,
    `E-mail: ${contato.email}`,
  ].filter(Boolean);

  const texto = linhasTexto.join('\n');
  const html = linhasTexto
    .map((linha) => (linha ? `<p>${linha}</p>` : '<br/>'))
    .join('');

  try {
    // Fallback via Resend API (evita bloqueios SMTP e timeouts)
    if (process.env.RESEND_API_KEY) {
      const mailFrom = process.env.MAIL_FROM || process.env.MAIL_USER || 'onboarding@resend.dev';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: mailFrom,
          to,
          subject: assunto,
          html,
        }),
      });

      if (response.ok) {
        return res.json({ ok: true, provider: 'resend' });
      } else {
        const detail = await response.text();
        console.error('Resend falhou:', detail);
        // Continua para tentar SMTP abaixo
      }
    }

    await transporter.sendMail({
      from: `Portal Imobiliário <${process.env.MAIL_USER}>`,
      to,
      subject: assunto,
      text: texto,
      html,
    });

    res.json({ ok: true, provider: 'smtp' });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ error: 'Falha ao enviar e-mail', detail: String(error) });
  }
});

// Middleware de tratamento de erros centralizado
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Erro NÃO TRATADO:', err.stack || err);

  // Não vazar detalhes do erro em produção
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Ocorreu um erro interno no servidor.' 
    : err.message;
  
  const errorDetails = process.env.NODE_ENV === 'production' ? {} : { stack: err.stack, name: err.name };

  res.status(err.statusCode || 500).json({
    error: errorMessage,
    ...errorDetails
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}`);
  console.log(`🚀 Health check: http://localhost:${PORT}/health`);
});
