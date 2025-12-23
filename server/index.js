import express from 'express';
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
  initializeDatabase = dbModule.initializeDatabase;
} else {
  // SQLite (desenvolvimento local)
  console.log('📁 Usando SQLite');
  const dbModule = await import('./database.js');
  db = dbModule.default;
  initializeDatabase = dbModule.initializeDatabase;
}

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configurado para produção
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(allowed => origin.includes(allowed))) {
      callback(null, true);
    } else {
      callback(null, true); // Permite todos em desenvolvimento
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Inicializar banco de dados
await initializeDatabase();

const requiredEnv = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASS'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.warn(`Variáveis ausentes: ${missing.join(', ')}. O envio de e-mail não funcionará sem elas.`);
}

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 465,
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

app.get('/health', async (_req, res) => {
  try {
    await transporter.verify();
    res.json({ status: 'ok', smtp: 'connected', db: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'SMTP connection failed', error: String(error) });
  }
});

// ==================== IMÓVEIS ====================

app.get('/api/imoveis', (_req, res) => {
  try {
    const imoveis = db.prepare('SELECT * FROM imoveis WHERE ativo = 1 ORDER BY criadoEm DESC').all();
    const imoveisComFotos = imoveis.map(imovel => ({
      ...imovel,
      fotos: JSON.parse(imovel.fotos || '[]'),
    }));
    res.json(imoveisComFotos);
  } catch (error) {
    console.error('Erro ao buscar imóveis:', error);
    res.status(500).json({ error: 'Erro ao buscar imóveis' });
  }
});

app.get('/api/imoveis/:id', (req, res) => {
  try {
    const { id } = req.params;
    const imovel = db.prepare('SELECT * FROM imoveis WHERE id = ?').get(id);
    if (!imovel) {
      return res.status(404).json({ error: 'Imóvel não encontrado' });
    }
    imovel.fotos = JSON.parse(imovel.fotos || '[]');
    res.json(imovel);
  } catch (error) {
    console.error('Erro ao buscar imóvel:', error);
    res.status(500).json({ error: 'Erro ao buscar imóvel' });
  }
});

app.post('/api/imoveis', (req, res) => {
  try {
    const imovel = req.body;
    const fotosJson = JSON.stringify(imovel.fotos || []);

    const stmt = db.prepare(`
      INSERT INTO imoveis (
        id, titulo, descricao, categoria, tipo, preco, ativo,
        endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, endereco_complemento,
        quartos, suites, banheiros, vagasGaragem, areaTotal, areaConstruida, anoConstructao, mobiliado, valorIptu, valorItu,
        escritorio, lavabo, despensa, areaServico, jardim, varandaGourmet, piscinaPrivativa, churrasqueiraPrivativa,
        numeroApartamento, andar, blocoTorre, nomeEmpreendimento, elevador, fachada,
        nomeEmpreendimentoLote, quadraLote, loteLote,
        valorCondominio, seguranca24h, portaria, elevadorCondominio, quadraEsportiva, piscina, salaoDeFestas, churrasqueira, playground, academia, vagasVisitante, salaCinema, hortaComunitaria, areaGourmetChurrasqueira, miniMercado, portariaRemota, coworking,
        rio, piscinaRural, represa, lago, curral, estabulo, galinheiro, pocilga, silo, terraceamento, energia, agua, acessoAsfalto, casariao, areaAlqueires, tipoAlqueire, valorItr,
        tipoVenda, aceitaPermuta, aceitaFinanciamento,
        fotos, nomeDono, cpfDono, telefoneDono, emailDono
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      imovel.id, imovel.titulo, imovel.descricao, imovel.categoria, imovel.tipo, imovel.preco, imovel.ativo,
      imovel.endereco.logradouro, imovel.endereco.numero, imovel.endereco.bairro, imovel.endereco.cidade, imovel.endereco.estado, imovel.endereco.cep, imovel.endereco.complemento,
      imovel.fichaTecnica.quartos, imovel.fichaTecnica.suites, imovel.fichaTecnica.banheiros, imovel.fichaTecnica.vagasGaragem, imovel.fichaTecnica.areaTotal, imovel.fichaTecnica.areaConstruida, imovel.fichaTecnica.anoConstructao, imovel.fichaTecnica.mobiliado, imovel.fichaTecnica.valorIptu, imovel.fichaTecnica.valorItu,
      imovel.fichaTecnica.escritorio, imovel.fichaTecnica.lavabo, imovel.fichaTecnica.despensa, imovel.fichaTecnica.areaServico, imovel.fichaTecnica.jardim, imovel.fichaTecnica.varandaGourmet, imovel.fichaTecnica.piscinaPrivativa, imovel.fichaTecnica.churrasqueiraPrivativa,
      imovel.dadosApartamento?.numeroApartamento, imovel.dadosApartamento?.andar, imovel.dadosApartamento?.blocoTorre, imovel.dadosApartamento?.nomeEmpreendimento, imovel.dadosApartamento?.elevador, imovel.dadosApartamento?.fachada,
      imovel.dadosLoteCondominio?.nomeEmpreendimento, imovel.dadosLoteCondominio?.quadra, imovel.dadosLoteCondominio?.lote,
      imovel.dadosCondominio.valorCondominio, imovel.dadosCondominio.seguranca24h, imovel.dadosCondominio.portaria, imovel.dadosCondominio.elevador, imovel.dadosCondominio.quadraEsportiva, imovel.dadosCondominio.piscina, imovel.dadosCondominio.salaoDeFestas, imovel.dadosCondominio.churrasqueira, imovel.dadosCondominio.playground, imovel.dadosCondominio.academia, imovel.dadosCondominio.vagasVisitante, imovel.dadosCondominio.salaCinema, imovel.dadosCondominio.hortaComunitaria, imovel.dadosCondominio.areaGourmetChurrasqueira, imovel.dadosCondominio.miniMercado, imovel.dadosCondominio.portariaRemota, imovel.dadosCondominio.coworking,
      imovel.dadosRural?.rio, imovel.dadosRural?.piscina, imovel.dadosRural?.represa, imovel.dadosRural?.lago, imovel.dadosRural?.curral, imovel.dadosRural?.estabulo, imovel.dadosRural?.galinheiro, imovel.dadosRural?.pocilga, imovel.dadosRural?.silo, imovel.dadosRural?.terraceamento, imovel.dadosRural?.energia, imovel.dadosRural?.agua, imovel.dadosRural?.acessoAsfalto, imovel.dadosRural?.casariao, imovel.dadosRural?.areaAlqueires, imovel.dadosRural?.tipoAlqueire, imovel.dadosRural?.valorItr,
      imovel.tipologia.tipoVenda, imovel.tipologia.aceitaPermuta, imovel.tipologia.aceitaFinanciamento,
      fotosJson, imovel.infoDono.nome, imovel.infoDono.cpf, imovel.infoDono.telefone, imovel.infoDono.email
    );

    res.json({ id: imovel.id });
  } catch (error) {
    console.error('Erro ao criar imóvel:', error);
    res.status(500).json({ error: 'Erro ao criar imóvel' });
  }
});

app.put('/api/imoveis/:id', (req, res) => {
  try {
    const { id } = req.params;
    const imovel = req.body;
    const fotosJson = JSON.stringify(imovel.fotos || []);

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
        fotos = ?, nomeDono = ?, cpfDono = ?, telefoneDono = ?, emailDono = ?, atualizadoEm = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      imovel.titulo, imovel.descricao, imovel.categoria, imovel.tipo, imovel.preco, imovel.ativo,
      imovel.endereco.logradouro, imovel.endereco.numero, imovel.endereco.bairro, imovel.endereco.cidade, imovel.endereco.estado, imovel.endereco.cep, imovel.endereco.complemento,
      imovel.fichaTecnica.quartos, imovel.fichaTecnica.suites, imovel.fichaTecnica.banheiros, imovel.fichaTecnica.vagasGaragem, imovel.fichaTecnica.areaTotal, imovel.fichaTecnica.areaConstruida, imovel.fichaTecnica.anoConstructao, imovel.fichaTecnica.mobiliado, imovel.fichaTecnica.valorIptu, imovel.fichaTecnica.valorItu,
      imovel.fichaTecnica.escritorio, imovel.fichaTecnica.lavabo, imovel.fichaTecnica.despensa, imovel.fichaTecnica.areaServico, imovel.fichaTecnica.jardim, imovel.fichaTecnica.varandaGourmet, imovel.fichaTecnica.piscinaPrivativa, imovel.fichaTecnica.churrasqueiraPrivativa,
      imovel.dadosApartamento?.numeroApartamento, imovel.dadosApartamento?.andar, imovel.dadosApartamento?.blocoTorre, imovel.dadosApartamento?.nomeEmpreendimento, imovel.dadosApartamento?.elevador, imovel.dadosApartamento?.fachada,
      imovel.dadosLoteCondominio?.nomeEmpreendimento, imovel.dadosLoteCondominio?.quadra, imovel.dadosLoteCondominio?.lote,
      imovel.dadosCondominio.valorCondominio, imovel.dadosCondominio.seguranca24h, imovel.dadosCondominio.portaria, imovel.dadosCondominio.elevador, imovel.dadosCondominio.quadraEsportiva, imovel.dadosCondominio.piscina, imovel.dadosCondominio.salaoDeFestas, imovel.dadosCondominio.churrasqueira, imovel.dadosCondominio.playground, imovel.dadosCondominio.academia, imovel.dadosCondominio.vagasVisitante, imovel.dadosCondominio.salaCinema, imovel.dadosCondominio.hortaComunitaria, imovel.dadosCondominio.areaGourmetChurrasqueira, imovel.dadosCondominio.miniMercado, imovel.dadosCondominio.portariaRemota, imovel.dadosCondominio.coworking,
      imovel.dadosRural?.rio, imovel.dadosRural?.piscina, imovel.dadosRural?.represa, imovel.dadosRural?.lago, imovel.dadosRural?.curral, imovel.dadosRural?.estabulo, imovel.dadosRural?.galinheiro, imovel.dadosRural?.pocilga, imovel.dadosRural?.silo, imovel.dadosRural?.terraceamento, imovel.dadosRural?.energia, imovel.dadosRural?.agua, imovel.dadosRural?.acessoAsfalto, imovel.dadosRural?.casariao, imovel.dadosRural?.areaAlqueires, imovel.dadosRural?.tipoAlqueire, imovel.dadosRural?.valorItr,
      imovel.tipologia.tipoVenda, imovel.tipologia.aceitaPermuta, imovel.tipologia.aceitaFinanciamento,
      fotosJson, imovel.infoDono.nome, imovel.infoDono.cpf, imovel.infoDono.telefone, imovel.infoDono.email,
      id
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar imóvel:', error);
    res.status(500).json({ error: 'Erro ao atualizar imóvel' });
  }
});

app.delete('/api/imoveis/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM imoveis WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao deletar imóvel:', error);
    res.status(500).json({ error: 'Erro ao deletar imóvel' });
  }
});

// ==================== LEADS ====================

app.get('/api/leads', (_req, res) => {
  try {
    const leads = db.prepare('SELECT * FROM leads ORDER BY criadoEm DESC').all();
    res.json(leads);
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
});

app.post('/api/leads', (req, res) => {
  try {
    const { id, imovelId, nomeCliente, telefoneCliente, emailCliente } = req.body;
    db.prepare(
      'INSERT INTO leads (id, imovelId, nomeCliente, telefoneCliente, emailCliente) VALUES (?, ?, ?, ?, ?)'
    ).run(id, imovelId, nomeCliente, telefoneCliente, emailCliente);
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro ao criar lead' });
  }
});

app.patch('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE leads SET visualizado = 1 WHERE id = ?').run(id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    res.status(500).json({ error: 'Erro ao atualizar lead' });
  }
});

// ==================== E-MAIL ====================

app.post('/api/send-lead', async (req, res) => {
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
    await transporter.sendMail({
      from: `Portal Imobiliário <${process.env.MAIL_USER}>`,
      to,
      subject: assunto,
      text: texto,
      html,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ error: 'Falha ao enviar e-mail', detail: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Banco de dados: ${process.cwd()}/portal_imobiliario.db`);
});
