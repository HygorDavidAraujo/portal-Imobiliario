# 🚀 Deploy no Railway - Portal Imobiliário

## 📋 Visão Geral

Este guia mostra como fazer deploy do Portal Imobiliário no Railway usando GitHub, mantendo **tudo 100% funcional**.

### Arquitetura de Deploy

```
GitHub Repository
    ↓
Railway (Backend + SQLite)
    ↓
Vercel/Netlify (Frontend React)
```

---

## ⚠️ IMPORTANTE: Railway vs SQLite

**Problema**: Railway tem sistema de arquivos **efêmero** (dados são perdidos ao redeploy)

**Soluções**:
1. **Recomendado**: Migrar para PostgreSQL (Railway oferece grátis)
2. **Alternativa**: Usar Railway Volumes (persistência de arquivos)
3. **Temporário**: SQLite com backup manual

---

## 🎯 Opção 1: PostgreSQL no Railway (RECOMENDADO)

### Por que PostgreSQL?
- ✅ Persistência permanente
- ✅ Railway oferece banco gratuito
- ✅ Escalável para produção
- ✅ Backups automáticos
- ✅ Sem perda de dados

### Passo 1: Preparar o Projeto

#### 1.1 Instalar dependências PostgreSQL

```bash
npm install pg
```

#### 1.2 Criar arquivo `server/database-postgres.js`

```javascript
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

await client.connect();

export const initializeDatabase = async () => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS imoveis (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descricao TEXT,
      categoria TEXT NOT NULL,
      tipo TEXT NOT NULL,
      preco REAL NOT NULL,
      ativo BOOLEAN DEFAULT true,
      
      endereco_logradouro TEXT,
      endereco_numero TEXT,
      endereco_bairro TEXT,
      endereco_cidade TEXT,
      endereco_estado TEXT,
      endereco_cep TEXT,
      endereco_complemento TEXT,
      
      quartos INTEGER,
      suites INTEGER,
      banheiros INTEGER,
      vagasGaragem INTEGER,
      areaTotal REAL,
      areaConstruida REAL,
      anoConstructao INTEGER,
      mobiliado BOOLEAN DEFAULT false,
      valorIptu REAL,
      valorItu REAL,
      
      escritorio BOOLEAN DEFAULT false,
      lavabo BOOLEAN DEFAULT false,
      despensa BOOLEAN DEFAULT false,
      areaServico BOOLEAN DEFAULT false,
      jardim BOOLEAN DEFAULT false,
      varandaGourmet BOOLEAN DEFAULT false,
      piscinaPrivativa BOOLEAN DEFAULT false,
      churrasqueiraPrivativa BOOLEAN DEFAULT false,
      
      numeroApartamento TEXT,
      andar TEXT,
      blocoTorre TEXT,
      nomeEmpreendimento TEXT,
      elevador BOOLEAN,
      fachada TEXT,
      
      nomeEmpreendimentoLote TEXT,
      quadraLote TEXT,
      loteLote TEXT,
      
      valorCondominio REAL,
      seguranca24h BOOLEAN DEFAULT false,
      portaria BOOLEAN DEFAULT false,
      elevadorCondominio BOOLEAN DEFAULT false,
      quadraEsportiva BOOLEAN DEFAULT false,
      piscina BOOLEAN DEFAULT false,
      salaoDeFestas BOOLEAN DEFAULT false,
      churrasqueira BOOLEAN DEFAULT false,
      playground BOOLEAN DEFAULT false,
      academia BOOLEAN DEFAULT false,
      vagasVisitante BOOLEAN DEFAULT false,
      salaCinema BOOLEAN DEFAULT false,
      hortaComunitaria BOOLEAN DEFAULT false,
      areaGourmetChurrasqueira BOOLEAN DEFAULT false,
      miniMercado BOOLEAN DEFAULT false,
      portariaRemota BOOLEAN DEFAULT false,
      coworking BOOLEAN DEFAULT false,
      
      rio BOOLEAN DEFAULT false,
      piscinaRural BOOLEAN DEFAULT false,
      represa BOOLEAN DEFAULT false,
      lago BOOLEAN DEFAULT false,
      curral BOOLEAN DEFAULT false,
      estabulo BOOLEAN DEFAULT false,
      galinheiro BOOLEAN DEFAULT false,
      pocilga BOOLEAN DEFAULT false,
      silo BOOLEAN DEFAULT false,
      terraceamento BOOLEAN DEFAULT false,
      energia BOOLEAN DEFAULT false,
      agua BOOLEAN DEFAULT false,
      acessoAsfalto BOOLEAN DEFAULT false,
      casariao BOOLEAN DEFAULT false,
      areaAlqueires REAL,
      tipoAlqueire TEXT,
      valorItr REAL,
      
      tipoVenda TEXT,
      aceitaPermuta BOOLEAN DEFAULT false,
      aceitaFinanciamento BOOLEAN DEFAULT false,
      
      fotos TEXT,
      nomeDono TEXT,
      cpfDono TEXT,
      telefoneDono TEXT,
      emailDono TEXT,
      
      criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      imovelId TEXT,
      imovelTitulo TEXT,
      clienteNome TEXT,
      clienteEmail TEXT,
      clienteTelefone TEXT,
      mensagem TEXT,
      visualizado BOOLEAN DEFAULT false,
      criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (imovelId) REFERENCES imoveis(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS contatos_cliente (
      id TEXT PRIMARY KEY,
      nome TEXT,
      email TEXT,
      telefone TEXT,
      criadoEm TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_imoveis_categoria ON imoveis(categoria);
    CREATE INDEX IF NOT EXISTS idx_imoveis_tipo ON imoveis(tipo);
    CREATE INDEX IF NOT EXISTS idx_imoveis_ativo ON imoveis(ativo);
    CREATE INDEX IF NOT EXISTS idx_leads_imovel ON leads(imovelId);
    CREATE INDEX IF NOT EXISTS idx_leads_visualizado ON leads(visualizado);
  `);
  
  console.log('✓ Database PostgreSQL inicializado');
};

export default client;
```

#### 1.3 Modificar `server/index.js` para suportar ambos

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

// Escolhe o banco baseado na variável de ambiente
let db, initializeDatabase;

if (process.env.DATABASE_URL) {
  // PostgreSQL (produção)
  const dbModule = await import('./database-postgres.js');
  db = dbModule.default;
  initializeDatabase = dbModule.initializeDatabase;
} else {
  // SQLite (desenvolvimento)
  const dbModule = await import('./database.js');
  db = dbModule.default;
  initializeDatabase = dbModule.initializeDatabase;
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Inicializar banco de dados
await initializeDatabase();

// ... resto do código permanece igual
```

### Passo 2: Configurar Railway

#### 2.1 Criar conta no Railway
1. Acesse https://railway.app
2. Clique em "Start a New Project"
3. Login com GitHub

#### 2.2 Criar novo projeto
1. Clique "New Project"
2. Selecione "Deploy from GitHub repo"
3. Escolha seu repositório do Portal Imobiliário

#### 2.3 Adicionar PostgreSQL
1. No dashboard do projeto, clique "+ New"
2. Selecione "Database" → "Add PostgreSQL"
3. Railway cria automaticamente a variável `DATABASE_URL`

#### 2.4 Configurar Variáveis de Ambiente

No painel do Railway, vá em "Variables" e adicione:

```env
# Banco de Dados (gerado automaticamente pelo Railway)
DATABASE_URL=postgresql://...

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=seu-email@gmail.com
MAIL_PASS=sua-senha-de-app
MAIL_TO=destinatario@gmail.com

# Cloudinary (upload de fotos)
# Recomendado: use CLOUDINARY_URL (uma única variável)
# Alternativa: use as 3 variáveis separadas
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...

# Server
PORT=4000
NODE_ENV=production
```

#### 2.5 Configurar Build

Crie `railway.json` na raiz do projeto:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "node server/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 2.6 Criar `Procfile` (opcional)

```
web: node server/index.js
```

### Passo 3: Deploy Automático

1. **Commit suas alterações**:
```bash
git add .
git commit -m "feat: configurar deploy railway com postgresql"
git push origin main
```

2. **Railway faz deploy automático**:
   - Detecta push no GitHub
   - Instala dependências
   - Executa build
   - Inicia servidor

3. **Acesse sua URL**:
   - Railway gera URL: `https://seu-projeto.railway.app`
   - Teste: `https://seu-projeto.railway.app/health`

---

## 🎯 Opção 2: SQLite com Railway Volumes

### ⚠️ Limitações
- Volumes custam $5/mês após trial
- Não recomendado para produção
- Use apenas para testes

### Configuração

#### 2.1 Criar Volume
1. No Railway, clique "+ New" → "Empty Service"
2. Vá em "Settings" → "Volumes"
3. Clique "New Volume"
4. Configure:
   - Name: `sqlite-data`
   - Mount Path: `/app/data`

#### 2.2 Modificar `server/database.js`

```javascript
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usar volume montado em produção
const dataDir = process.env.RAILWAY_VOLUME_MOUNT_PATH || __dirname;
const dbPath = path.resolve(dataDir, '../portal_imobiliario.db');

console.log('📁 Database path:', dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ... resto do código
```

#### 2.3 Variável de Ambiente

```env
RAILWAY_VOLUME_MOUNT_PATH=/app/data
```

---

## 🌐 Deploy do Frontend (Vercel)

### Passo 1: Preparar Frontend

#### 1.1 Criar arquivo `vercel.json` na raiz:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 1.2 Atualizar `.env.production`:

```env
VITE_API_BASE_URL=https://seu-projeto.railway.app
```

### Passo 2: Deploy no Vercel

1. Acesse https://vercel.com
2. Login com GitHub
3. Import Repository
4. Configure:
   - Framework Preset: Vite
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. Adicione variável de ambiente:
   ```
   VITE_API_BASE_URL=https://seu-projeto.railway.app
   ```

6. Deploy!

---

## 🔧 Configuração CORS

Atualize `server/index.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://seu-dominio.vercel.app',
    process.env.FRONTEND_URL
  ],
  credentials: true
}));
```

Adicione no Railway:
```env
FRONTEND_URL=https://seu-dominio.vercel.app
```

---

## 📊 Estrutura Final

```
GitHub Repository
    ↓
Railway (Backend)
├── PostgreSQL Database
├── Express Server
├── Email Service
└── API Endpoints
    ↓
Vercel (Frontend)
├── React App
├── Vite Build
└── Static Assets
```

---

## ✅ Checklist de Deploy

### Backend (Railway)
- [ ] PostgreSQL adicionado
- [ ] Variáveis de ambiente configuradas
- [ ] `railway.json` criado
- [ ] `server/database-postgres.js` criado
- [ ] CORS configurado com URL do Vercel
- [ ] Push para GitHub realizado
- [ ] Deploy automático funcionando
- [ ] Teste `/health` endpoint

### Frontend (Vercel)
- [ ] `vercel.json` criado
- [ ] `.env.production` com URL do Railway
- [ ] Repository importado
- [ ] Build configurado
- [ ] Deploy realizado
- [ ] Teste no navegador

### Validação
- [ ] Criar imóvel funciona
- [ ] Dados persistem
- [ ] Email é enviado
- [ ] Leads salvam
- [ ] Imagens carregam

---

## 🧪 Testes Pós-Deploy

### 1. Teste Backend
```bash
curl https://seu-projeto.railway.app/health
```

Deve retornar:
```json
{
  "status": "ok",
  "smtp": "connected",
  "db": "connected"
}
```

### 2. Teste API
```bash
curl https://seu-projeto.railway.app/api/imoveis
```

### 3. Teste Frontend
- Abra `https://seu-dominio.vercel.app`
- Crie um imóvel
- Verifique se persiste

---

## 🔍 Troubleshooting

### Erro: "Database connection failed"
**Solução**:
1. Verifique `DATABASE_URL` no Railway
2. Confirme PostgreSQL está rodando
3. Veja logs: `railway logs`

### Erro: "CORS blocked"
**Solução**:
1. Adicione URL do Vercel no CORS
2. Configure `FRONTEND_URL` no Railway
3. Redeploy

### Erro: "Cannot find module"
**Solução**:
1. Verifique `package.json` tem todas dependências
2. `npm install` antes do commit
3. Confirme `railway.json` tem buildCommand correto

### Imagens não carregam
**Solução**:
1. Aumente limite JSON: `app.use(express.json({ limit: '50mb' }))`
2. Configure timeout no Railway
3. Use Cloudinary para imagens (recomendado)

---

## 💰 Custos

### Railway (Free Tier)
- ✅ $5 crédito/mês grátis
- ✅ PostgreSQL incluído
- ✅ 500GB tráfego
- ⚠️ Após trial, ~$5/mês

### Vercel (Free Tier)
- ✅ 100% gratuito para projetos pessoais
- ✅ Deploy ilimitados
- ✅ SSL automático
- ✅ CDN global

**Total**: Gratuito (dentro dos limites)

---

## 🚀 Comandos Úteis

### Railway CLI

```bash
# Instalar
npm i -g @railway/cli

# Login
railway login

# Deploy manual
railway up

# Ver logs
railway logs

# Abrir dashboard
railway open
```

### Git Deploy

```bash
# Commit alterações
git add .
git commit -m "feat: configuração production"
git push origin main

# Railway faz deploy automático!
```

---

## 📚 Próximos Passos

### Melhorias Recomendadas

1. **Cloudinary para Imagens**
   - Evita Base64 grande no JSON
   - CDN rápido
   - Transformações automáticas

2. **Redis para Cache**
   - Railway oferece Redis
   - Cache de listagens
   - Performance++

3. **Monitoring**
   - Railway Analytics
   - Sentry para errors
   - Logs estruturados

4. **CI/CD**
   - GitHub Actions
   - Testes automáticos
   - Deploy preview

---

## 🎯 Resumo Executivo

### Para Deploy Rápido:

1. **Railway**: 
   - Adicione PostgreSQL
   - Configure variáveis
   - Push para GitHub

2. **Vercel**:
   - Import repository
   - Configure build
   - Deploy

3. **Teste**:
   - Criar imóvel
   - Verificar persistência
   - Validar emails

**Tempo estimado**: 30 minutos

---

## 🆘 Precisa de Ajuda?

### Logs do Railway
```bash
railway logs --tail 100
```

### Logs do Vercel
- Dashboard → Deployments → Ver logs

### Database PostgreSQL
```bash
railway run psql $DATABASE_URL
```

---

## ✅ Deploy Completo!

Após seguir este guia, você terá:

✅ Backend no Railway com PostgreSQL
✅ Frontend no Vercel
✅ Deploy automático via GitHub
✅ Dados persistentes
✅ Emails funcionando
✅ SSL/HTTPS automático
✅ Escalável para produção

**Seu portal está no ar! 🎉**
