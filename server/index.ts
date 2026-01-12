

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import multer, { MulterError } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { imovelSchema, leadSchema, sendLeadEmailSchema, validateAndFormat } from './schemas.js';

dotenv.config();

const gerarId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const JWT_SECRET = process.env.JWT_SECRET || 'portal-imobiliario-secret-key-change-in-production';
const JWT_EXPIRATION = '24h';

// ==================== CONFIGURAÇÃO CLOUDINARY ====================
// Suporta tanto as variáveis separadas quanto CLOUDINARY_URL.
// - Produção (Railway/Vercel): configure via painel de variáveis.
// - Local: pode usar .env
if (process.env.CLOUDINARY_URL) {
  // O SDK lê CLOUDINARY_URL do ambiente; só garantimos HTTPS.
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Configuração do Multer para upload em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo por arquivo
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  },
});

const app = express();

// ==================== CONFIGURAÇÃO DE CORS (ANTES DAS ROTAS) ====================
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://portal-imobiliario-production.up.railway.app',
  'https://portal-imobiliario-vert.vercel.app',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some((allowed) => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ==================== LOGIN ADMIN OTP ====================
const ADMIN_PHONE = '+5562981831483';
const OTP_EXPIRATION = 60 * 1000; // 60 segundos
const OTP_ATTEMPT_LIMIT = 5;
let adminOtp: {
  hash: string;
  expires: number;
  attempts: number;
} | null = null;
let lastOtpSentAt = 0;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp: string) {
  return crypto.createHash('sha256').update(otp + process.env.OTP_SECRET).digest('hex');
}


// Envio real: agora por e-mail
async function sendOtpViaEmail(otp: string, email: string) {
  const subject = 'Seu código de acesso administrativo';
  const text = `Seu código de acesso ao Portal Imobiliário: ${otp}`;
  const html = `<p>Seu código de acesso ao <b>Portal Imobiliário</b>:</p><h2>${otp}</h2>`;

  // Log para depuração: mostrar se RESEND_API_KEY está presente
  const resendKey = process.env.RESEND_API_KEY;
  console.log('[OTP] RESEND_API_KEY:', resendKey ? resendKey.slice(0, 8) + '...' : 'NÃO DEFINIDO');
  if (resendKey) {
    console.log('[OTP] Tentando envio via Resend API...');
    const mailFrom = process.env.MAIL_FROM || process.env.MAIL_USER || 'onboarding@resend.dev';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: mailFrom,
        to: email,
        subject,
        html,
      }),
    });
    if (response.ok) {
      console.log('[OTP] Enviado por Resend API');
      return;
    } else {
      const detail = await response.text();
      console.error('[OTP] Resend falhou:', detail);
      // Continua para tentar SMTP abaixo
    }
  } else {
    console.log('[OTP] RESEND_API_KEY não definido, pulando envio via Resend.');
  }

  console.log('[OTP] Tentando envio via SMTP (nodemailer)...');

  // Fallback para SMTP local
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  const info = await transporter.sendMail({
    from: `Portal Imobiliário <${process.env.MAIL_USER}>`,
    to: email,
    subject,
    text,
    html,
  });
  console.log('OTP enviado por SMTP:', info.messageId);
}

// Rate limit básico: impede spam de envio
app.post('/api/admin/send-otp', async (req: Request, res: Response) => {
  const now = Date.now();
  if (now - lastOtpSentAt < 5000) {
    return res.status(429).json({ error: 'Aguarde alguns segundos para reenviar.' });
  }
  const otp = generateOtp();
  const hash = hashOtp(otp);
  adminOtp = {
    hash,
    expires: now + OTP_EXPIRATION,
    attempts: 0,
  };
  lastOtpSentAt = now;
  try {
    await sendOtpViaEmail(otp, process.env.MAIL_TO || 'hygordavidaraujo@gmail.com');
  } catch (e) {
    console.error('Erro ao enviar e-mail:', e);
    return res.status(500).json({ error: 'Erro ao enviar e-mail.' });
  }
  res.json({ ok: true });
});

// Validação do OTP
app.post('/api/admin/validate-otp', express.json(), (req: Request, res: Response) => {
  const { otp } = req.body || {};
  if (!otp || typeof otp !== 'string' || otp.length !== 6) {
    return res.status(400).json({ error: 'Código inválido.' });
  }
  if (!adminOtp || Date.now() > adminOtp.expires) {
    adminOtp = null;
    return res.status(400).json({ error: 'Código expirado. Solicite um novo.' });
  }
  if (adminOtp.attempts >= OTP_ATTEMPT_LIMIT) {
    adminOtp = null;
    return res.status(429).json({ error: 'Muitas tentativas. Solicite um novo código.' });
  }
  adminOtp.attempts++;
  if (hashOtp(otp) !== adminOtp.hash) {
    return res.status(400).json({ error: 'Código incorreto.' });
  }
  // Sucesso: invalida o código e emite JWT
  adminOtp = null;
  const token = jwt.sign(
    { role: 'admin', iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
  res.json({ ok: true, token });
});

// ==================== MIDDLEWARE DE AUTENTICAÇÃO ====================
interface AuthRequest extends Request {
  user?: { role: string; iat: number };
}

const authenticateAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { role: string; iat: number };
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

type SortImoveis = 'data-desc' | 'data-asc' | 'preco-asc' | 'preco-desc';

const parsePositiveInt = (value: unknown, fallback: number, min: number, max: number) => {
  const num = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(num)));
};

const parseSortImoveis = (value: unknown): SortImoveis => {
  const raw = String(value || 'data-desc');
  if (raw === 'data-asc' || raw === 'preco-asc' || raw === 'preco-desc') return raw;
  return 'data-desc';
};

const parseOptionalString = (value: unknown) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  return raw.length ? raw : undefined;
};

const parseOptionalNumber = (value: unknown) => {
  const raw = typeof value === 'string' ? value.replace(',', '.').trim() : '';
  if (!raw) return undefined;
  const num = Number(raw);
  if (!Number.isFinite(num)) return undefined;
  return num;
};

// Escolhe o banco baseado na variável de ambiente
let db, initializeDatabase;

const dbProvider = String(process.env.DB_PROVIDER || '').toLowerCase();

if (dbProvider === 'sqlite') {
  console.log('📁 Usando SQLite (DB_PROVIDER=sqlite)');
  try {
    const dbModule = await import('./database.js');
    db = dbModule.default;
    initializeDatabase = dbModule.initializeDatabase;
  } catch (error) {
    console.error('⚠️  SQLite não disponível. Use PostgreSQL em produção.');
    throw new Error('SQLite indisponível. Verifique dependências/ambiente.');
  }
} else if (process.env.DATABASE_URL) {
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

const PORT = Number(process.env.PORT) || 4000;

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
  // Prioriza os campos do banco: nomeCliente, emailCliente, telefoneCliente
  // Log para debug dos campos recebidos do banco
  console.log('DEBUG LEAD ROW:', {
    nomeCliente: row.nomeCliente,
    clienteNome: row.clienteNome,
    nomecliente: row.nomecliente,
    emailCliente: row.emailCliente,
    clienteEmail: row.clienteEmail,
    emailcliente: row.emailcliente,
    telefoneCliente: row.telefoneCliente,
    clienteTelefone: row.clienteTelefone,
    telefonecliente: row.telefonecliente,
  });
  // Garante que pega os campos minúsculos do PostgreSQL
  const clienteNome = String(row.nomeCliente || row.clienteNome || row.nomecliente || row.clientenome || row.nome || '');
  const clienteEmail = String(row.emailCliente || row.clienteEmail || row.emailcliente || row.clienteemail || row.email || '');
  const clienteTelefone = String(row.telefoneCliente || row.clienteTelefone || row.telefonecliente || row.clientetelefone || row.telefone || '');
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
    const dbStatus = String(process.env.DB_PROVIDER || '').toLowerCase() === 'sqlite'
      ? 'sqlite'
      : (process.env.DATABASE_URL ? 'postgresql' : 'sqlite');
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

// ==================== UPLOAD DE IMAGENS ====================

app.post('/api/upload-image', authenticateAdmin, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const hasCloudinaryUrl = Boolean(process.env.CLOUDINARY_URL);
    const hasCloudName = Boolean(process.env.CLOUDINARY_CLOUD_NAME);
    const hasApiKey = Boolean(process.env.CLOUDINARY_API_KEY);
    const hasApiSecret = Boolean(process.env.CLOUDINARY_API_SECRET);
    const hasCloudinaryParts = hasCloudName && hasApiKey && hasApiSecret;
    if (!hasCloudinaryUrl && !hasCloudinaryParts) {
      console.error('[UPLOAD] Cloudinary não configurado', {
        CLOUDINARY_URL: hasCloudinaryUrl,
        CLOUDINARY_CLOUD_NAME: hasCloudName,
        CLOUDINARY_API_KEY: hasApiKey,
        CLOUDINARY_API_SECRET: hasApiSecret,
      });
      return res.status(500).json({
        error:
          'Cloudinary não configurado no servidor. Defina CLOUDINARY_URL (recomendado) ou CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem fornecida' });
    }

    const imovelId = req.body.imovelId || 'temp';
    
    // Upload para Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `portal-imobiliario/imoveis/${imovelId}`,
          resource_type: 'image',
          tags: [imovelId, 'portal-imobiliario'],
          transformation: [
            { width: 1200, height: 900, crop: 'limit', quality: 'auto' },
            { fetch_format: 'auto' }
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file!.buffer);
    });

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da imagem', detail });
  }
});

// Endpoint para deletar imagem do Cloudinary
app.delete('/api/delete-image', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ error: 'publicId é obrigatório' });
    }

    await cloudinary.uploader.destroy(publicId);
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    res.status(500).json({ error: 'Erro ao deletar imagem' });
  }
});

// ==================== IMÓVEIS ====================

app.get('/api/imoveis/facets', async (req: Request, res: Response) => {
  try {
    // status=all (inclui inativos) deve ser admin-only
    const status = String(req.query.status || '');
    if (status === 'all') {
      let allowed = false;
      authenticateAdmin(req as AuthRequest, res, () => {
        allowed = true;
      });
      if (!allowed) return;
    }

    const wherePublico = status !== 'all';

    if (db?.prisma) {
      const where = wherePublico ? { ativo: true } : {};
      const [bairros, cidades, tipos] = await Promise.all([
        db.prisma.imovel.findMany({ where, distinct: ['endereco_bairro'], select: { endereco_bairro: true } }),
        db.prisma.imovel.findMany({ where, distinct: ['endereco_cidade'], select: { endereco_cidade: true } }),
        db.prisma.imovel.findMany({ where, distinct: ['tipo'], select: { tipo: true } }),
      ]);

      return res.json({
        bairros: bairros.map((b: any) => String(b.endereco_bairro || '')).filter((s: string) => s.trim().length).sort((a: string, b: string) => a.localeCompare(b, 'pt-BR')),
        cidades: cidades.map((c: any) => String(c.endereco_cidade || '')).filter((s: string) => s.trim().length).sort((a: string, b: string) => a.localeCompare(b, 'pt-BR')),
        tipos: tipos.map((t: any) => String(t.tipo || '')).filter((s: string) => s.trim().length).sort((a: string, b: string) => a.localeCompare(b, 'pt-BR')),
      });
    }

    const whereClause = wherePublico ? 'WHERE ativo = ?' : '';
    const andClause = wherePublico ? 'AND' : 'WHERE';
    const whereParams: any[] = wherePublico ? [true] : [];

    const [bairrosRows, cidadesRows, tiposRows] = await Promise.all([
      db.prepare(`SELECT DISTINCT endereco_bairro as v FROM imoveis ${whereClause} ${andClause} endereco_bairro IS NOT NULL AND endereco_bairro != '' ORDER BY endereco_bairro`).all(...whereParams),
      db.prepare(`SELECT DISTINCT endereco_cidade as v FROM imoveis ${whereClause} ${andClause} endereco_cidade IS NOT NULL AND endereco_cidade != '' ORDER BY endereco_cidade`).all(...whereParams),
      db.prepare(`SELECT DISTINCT tipo as v FROM imoveis ${whereClause} ${andClause} tipo IS NOT NULL AND tipo != '' ORDER BY tipo`).all(...whereParams),
    ]);

    res.json({
      bairros: (bairrosRows || []).map((r: any) => String(r.v || '')).filter((s: string) => s.trim().length),
      cidades: (cidadesRows || []).map((r: any) => String(r.v || '')).filter((s: string) => s.trim().length),
      tipos: (tiposRows || []).map((r: any) => String(r.v || '')).filter((s: string) => s.trim().length),
    });
  } catch (error) {
    console.error('Erro ao buscar facets de imóveis:', error);
    res.status(500).json({ error: 'Erro ao buscar filtros' });
  }
});

app.get('/api/imoveis', async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status || '');

    // status=all (inclui inativos) deve ser admin-only
    if (status === 'all') {
      let allowed = false;
      authenticateAdmin(req as AuthRequest, res, () => {
        allowed = true;
      });
      if (!allowed) return;
    }

    const page = parsePositiveInt(req.query.page, 1, 1, 1_000_000);
    const limit = parsePositiveInt(req.query.limit, 20, 1, 100);
    const sort = parseSortImoveis(req.query.sort);
    const offset = (page - 1) * limit;

    const wherePublico = status !== 'all';

    const filtroId = parseOptionalString(req.query.id);
    const categoria = parseOptionalString(req.query.categoria);
    const tipo = parseOptionalString(req.query.tipo);
    const bairro = parseOptionalString(req.query.bairro);
    const cidade = parseOptionalString(req.query.cidade);
    const estado = parseOptionalString(req.query.estado);
    const precoMin = parseOptionalNumber(req.query.precoMin);
    const precoMax = parseOptionalNumber(req.query.precoMax);
    const quartosMin = (() => {
      const q = parseOptionalNumber(req.query.quartos);
      if (typeof q !== 'number') return undefined;
      if (!Number.isFinite(q)) return undefined;
      return Math.max(0, Math.trunc(q));
    })();

    // PostgreSQL (Prisma)
    if (db?.prisma) {
      const where: any = wherePublico ? { ativo: true } : {};
      if (filtroId) where.id = { contains: filtroId, mode: 'insensitive' };
      if (categoria) where.categoria = categoria;
      if (tipo) where.tipo = tipo;
      if (bairro) where.endereco_bairro = { contains: bairro, mode: 'insensitive' };
      if (cidade) where.endereco_cidade = { contains: cidade, mode: 'insensitive' };
      if (estado) where.endereco_estado = { contains: estado, mode: 'insensitive' };
      if (typeof precoMin === 'number' || typeof precoMax === 'number') {
        where.preco = {
          ...(typeof precoMin === 'number' ? { gte: precoMin } : {}),
          ...(typeof precoMax === 'number' ? { lte: precoMax } : {}),
        };
      }
      if (typeof quartosMin === 'number' && quartosMin > 0) {
        where.quartos = { gte: quartosMin };
      }
      const orderBy =
        sort === 'data-asc'
          ? ({ criadoEm: 'asc' } as const)
          : sort === 'preco-asc'
            ? ({ preco: 'asc' } as const)
            : sort === 'preco-desc'
              ? ({ preco: 'desc' } as const)
              : ({ criadoEm: 'desc' } as const);

      const [total, rows] = await Promise.all([
        db.prisma.imovel.count({ where }),
        db.prisma.imovel.findMany({ where, orderBy, skip: offset, take: limit }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / limit));
      const mapped = (rows || []).map(mapRowToImovel);

      return res.json({
        data: mapped,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    }

    // SQLite
    const conditions: string[] = [];
    const whereParams: any[] = [];
    if (wherePublico) {
      conditions.push('ativo = ?');
      whereParams.push(true);
    }
    if (filtroId) {
      conditions.push('LOWER(id) LIKE ?');
      whereParams.push(`%${filtroId.toLowerCase()}%`);
    }
    if (categoria) {
      conditions.push('categoria = ?');
      whereParams.push(categoria);
    }
    if (tipo) {
      conditions.push('tipo = ?');
      whereParams.push(tipo);
    }
    if (bairro) {
      conditions.push('LOWER(endereco_bairro) LIKE ?');
      whereParams.push(`%${bairro.toLowerCase()}%`);
    }
    if (cidade) {
      conditions.push('LOWER(endereco_cidade) LIKE ?');
      whereParams.push(`%${cidade.toLowerCase()}%`);
    }
    if (estado) {
      conditions.push('LOWER(endereco_estado) LIKE ?');
      whereParams.push(`%${estado.toLowerCase()}%`);
    }
    if (typeof precoMin === 'number') {
      conditions.push('preco >= ?');
      whereParams.push(precoMin);
    }
    if (typeof precoMax === 'number') {
      conditions.push('preco <= ?');
      whereParams.push(precoMax);
    }
    if (typeof quartosMin === 'number' && quartosMin > 0) {
      conditions.push('quartos >= ?');
      whereParams.push(quartosMin);
    }

    const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';

    const orderBy =
      sort === 'data-asc'
        ? 'criadoEm ASC'
        : sort === 'preco-asc'
          ? 'preco ASC'
          : sort === 'preco-desc'
            ? 'preco DESC'
            : 'criadoEm DESC';

    const countRow = await db.prepare(`SELECT COUNT(*) as total FROM imoveis${whereClause}`).get(...whereParams);
    const total = Number((countRow as any)?.total || 0);

    const rows = await db
      .prepare(`SELECT * FROM imoveis${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .all(...whereParams, limit, offset);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    const mapped = (rows || []).map(mapRowToImovel);

    res.json({
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar imóveis:', error);
    res.status(500).json({ error: 'Erro ao buscar imóveis' });
  }
});

// Gera um ID novo (pré-cadastro) para permitir upload de fotos na pasta correta.
// IMPORTANTE: precisa vir antes de /api/imoveis/:id para não ser capturada como "id=next-id".
// Observação: não “reserva” o ID globalmente; em cenários com múltiplos admins simultâneos,
// o ID pode colidir. O POST /api/imoveis ainda valida e falha com 409 se já existir.
app.get('/api/imoveis/next-id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const tipo = String(req.query.tipo || '').trim();
    if (!tipo) {
      return res.status(400).json({ error: 'Parâmetro tipo é obrigatório' });
    }

    const id = await gerarProximoId(tipo);
    return res.json({ id });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error('Erro ao gerar next-id:', error);
    return res.status(500).json({ error: 'Erro ao gerar ID do imóvel', detail });
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

app.post('/api/imoveis', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const imovel = req.body;

    // --- Validação com Zod ---
    const validation = validateAndFormat(imovelSchema, imovel);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Dados do imóvel inválidos',
        details: validation.errors
      });
    }
    const validatedImovel = validation.data as any;

    const prefixoEsperado = obterPrefixoTipo(validatedImovel.tipo);
    const requestedId = typeof validatedImovel.id === 'string' ? validatedImovel.id.trim() : '';
    let novoId = '';

    if (requestedId) {
      const suffix = requestedId.slice(prefixoEsperado.length);
      const prefixOk = requestedId.startsWith(prefixoEsperado);
      const suffixOk = suffix.length >= 3 && /^[0-9]+$/.test(suffix);
      if (!prefixOk || !suffixOk) {
        return res.status(400).json({
          error: `ID inválido para o tipo informado. Esperado prefixo ${prefixoEsperado} e sufixo numérico (ex: ${prefixoEsperado}001).`,
        });
      }

      if (!db.prisma) throw new Error('Prisma client não está disponível. Verifique a configuração do banco de dados.');
      const exists = await db.prisma.imovel.findUnique({ where: { id: requestedId }, select: { id: true } });
      if (exists) {
        return res.status(409).json({ error: `ID já existe: ${requestedId}` });
      }

      novoId = requestedId;
      console.log(`📝 Criando imóvel com ID fornecido: ${novoId} (${validatedImovel.tipo})`);
    } else {
      novoId = await gerarProximoId(validatedImovel.tipo);
      console.log(`📝 Gerando novo imóvel: ${novoId} (${validatedImovel.tipo})`);
    }

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
    } = validatedImovel;

    const dataToCreate = {
      id: novoId,
      titulo: validatedImovel.titulo,
      descricao: validatedImovel.descricao,
      categoria: validatedImovel.categoria,
      tipo: validatedImovel.tipo,
      preco: validatedImovel.preco,
      ativo: validatedImovel.ativo ?? true,

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

app.put('/api/imoveis/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
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

app.delete('/api/imoveis/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
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

app.get('/api/leads/stats', authenticateAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    if (db?.prisma) {
      const [total, naoVisualizados] = await Promise.all([
        db.prisma.lead.count(),
        db.prisma.lead.count({ where: { visualizado: false } }),
      ]);
      return res.json({ total, naoVisualizados });
    }

    const totalRow = await db.prepare('SELECT COUNT(*) as total FROM leads').get();
    const naoRow = await db.prepare('SELECT COUNT(*) as total FROM leads WHERE visualizado = ?').get(false);
    return res.json({
      total: Number((totalRow as any)?.total || 0),
      naoVisualizados: Number((naoRow as any)?.total || 0),
    });
  } catch (error) {
    console.error('Erro ao buscar stats de leads:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas de leads' });
  }
});

app.get('/api/leads', authenticateAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1, 1, 1_000_000);
    const limit = parsePositiveInt(req.query.limit, 50, 1, 200);
    const offset = (page - 1) * limit;

    const visualizadoRaw = typeof req.query.visualizado === 'string' ? req.query.visualizado : undefined;
    const sortRaw = typeof req.query.sort === 'string' ? req.query.sort : 'data-desc';
    const sort = sortRaw === 'data-asc' ? 'data-asc' : 'data-desc';
    const filterVisualizado = visualizadoRaw === 'true' ? true : visualizadoRaw === 'false' ? false : undefined;

    // PostgreSQL (Prisma)
    if (db?.prisma) {
      const where = typeof filterVisualizado === 'boolean' ? { visualizado: filterVisualizado } : {};
      const [total, rows] = await Promise.all([
        db.prisma.lead.count({ where }),
        db.prisma.lead.findMany({
          where,
          orderBy: { criadoEm: sort === 'data-asc' ? 'asc' : 'desc' },
          skip: offset,
          take: limit,
        }),
      ]);

      const mapped = (rows || []).map(mapRowToLead);
      const totalPages = Math.max(1, Math.ceil(total / limit));

      return res.json({
        data: mapped,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      });
    }

    // SQLite
    const conditions: string[] = [];
    const whereParams: any[] = [];
    if (typeof filterVisualizado === 'boolean') {
      conditions.push('visualizado = ?');
      whereParams.push(filterVisualizado);
    }
    const whereClause = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = sort === 'data-asc' ? 'criadoEm ASC' : 'criadoEm DESC';

    const countRow = await db.prepare(`SELECT COUNT(*) as total FROM leads${whereClause}`).get(...whereParams);
    const total = Number((countRow as any)?.total || 0);

    const leads = await db
      .prepare(`SELECT * FROM leads${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
      .all(...whereParams, limit, offset);

    const mapped = (leads || []).map(mapRowToLead);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

app.post('/api/leads', async (req: Request, res: Response) => {
  try {
    const bodyLead = req.body || {};
    
    // Normaliza dados para o schema esperado
    const leadData = {
      id: bodyLead.id,
      imovelId: bodyLead.imovelId,
      imovelTitulo: bodyLead.imovelTitulo || bodyLead.titulo,
      cliente: {
        nome: bodyLead.nomeCliente || bodyLead.cliente?.nome,
        email: bodyLead.emailCliente || bodyLead.cliente?.email,
        telefone: bodyLead.telefoneCliente || bodyLead.cliente?.telefone,
      },
      data: new Date(),
      visualizado: false,
    };

    // --- Validação com Zod ---
    const validation = validateAndFormat(leadSchema, leadData);
    if (!validation.success) {
      console.error('❌ Lead inválido:', validation.errors);
      return res.status(400).json({ 
        error: 'Dados do lead inválidos',
        details: validation.errors
      });
    }
    const validatedLead = validation.data as any;
    console.log('📝 Lead POST:', { id: validatedLead.id, imovelId: validatedLead.imovelId, titulo: validatedLead.imovelTitulo });
    
    const stmt = db.prepare(
      'INSERT INTO leads (id, imovelId, imovelTitulo, clienteNome, clienteEmail, clienteTelefone) VALUES (?, ?, ?, ?, ?, ?)'
    );
    await stmt.run(
      validatedLead.id || gerarId(),
      validatedLead.imovelId,
      validatedLead.imovelTitulo,
      validatedLead.cliente.nome,
      validatedLead.cliente.email,
      validatedLead.cliente.telefone
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
});

app.patch('/api/leads/:id', authenticateAdmin, async (req: AuthRequest, res: Response) => {
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
  const payload = req.body || {};

  // --- Validação com Zod ---
  const validation = validateAndFormat(sendLeadEmailSchema, payload);
  if (!validation.success) {
    return res.status(400).json({ 
      error: 'Dados do lead inválidos',
      details: validation.errors
    });
  }
  
  const { imovelId, imovelTitulo, preco, endereco, contato, link } = validation.data as any;

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
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Imagem excede o limite de 5MB.' });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  }

  if (err instanceof Error && err.message === 'Apenas imagens são permitidas') {
    return res.status(400).json({ error: err.message });
  }

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
  const dbLog = String(process.env.DB_PROVIDER || '').toLowerCase() === 'sqlite'
    ? 'SQLite'
    : (process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite');
  console.log(`💾 Database: ${dbLog}`);
  console.log(`🚀 Health check: http://localhost:${PORT}/health`);
});
