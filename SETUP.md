# Portal Imobiliário - Guia de Configuração e Execução

## 📋 Visão Geral

Portal imobiliário completo com:
- ✅ Gerenciamento de imóveis (CRUD)
- ✅ Banco de dados SQLite persistente
- ✅ Sistema de leads com captura de contatos
- ✅ Envio de emails automático via Gmail
- ✅ Sincronização de dados entre frontend e backend
- ✅ Catálogo com filtros avançados
- ✅ Sistema de favoritos (localStorage)

## 🚀 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Conta Gmail com senha de aplicativo gerada

## 📦 Instalação de Dependências

Todas as dependências estão listadas em `package.json`:

```bash
npm install
```

**Dependências principais:**
- **Frontend**: React 18, React Router, Tailwind CSS, TypeScript
- **Backend**: Express, better-sqlite3, Nodemailer
- **Ferramentas**: Vite, ESLint, TypeScript

## ⚙️ Configuração de Variáveis de Ambiente

### 1. Frontend (`.env.local`)
```
VITE_API_BASE_URL=http://localhost:4000
```

✅ Já configurado no projeto

### 2. Backend (`.env`)
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=seu-email@gmail.com
MAIL_PASS=sua-senha-de-app
MAIL_TO=destinatario@gmail.com
PORT=4000
```

✅ Já configurado com suas credenciais Gmail

## 🗄️ Banco de Dados

### Automático
O banco de dados SQLite é **criado automaticamente** na primeira execução do servidor.

**Localização**: `portal_imobiliario.db` (na raiz do projeto)

### Tabelas criadas automaticamente:
- **imoveis**: Armazena propriedades (80+ colunas)
- **leads**: Armazena contatos de clientes
- **contatos_cliente**: Histórico de contatos

### Colunas principais da tabela `imoveis`:
```
id, titulo, descricao, categoria, tipo, preco, ativo
endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep
quartos, suites, banheiros, vagasGaragem, areaTotal, areaConstruida, anoConstructao
mobiliado, escritorio, lavabo, despensa, areaServico, jardim, varandaGourmet
piscinaPrivativa, churrasqueiraPrivativa, valorIptu, valorItu
... e mais 40+ colunas para dados específicos de apartamentos, condomínios e rurais
```

## 🏃 Execução

### Opção 1: Desenvolvimento com dois terminais (Recomendado)

**Terminal 1 - Backend (Express na porta 4000):**
```bash
npm run server
```

Você deve ver:
```
Servidor rodando em http://localhost:4000
Banco de dados inicializado ✓
```

**Terminal 2 - Frontend (Vite na porta 5173):**
```bash
npm run dev
```

Você deve ver:
```
VITE v5.0.8  ready in ... ms

➜  Local:   http://localhost:5173/
```

### Opção 2: Script único (cria ambos em paralelo)

Se tiver o comando `concurrently` instalado:
```bash
npm run start
```

## 📍 Acessar a Aplicação

- **Frontend**: http://localhost:5173
- **API Health Check**: http://localhost:4000/health

## 🔄 Fluxo de Dados

### 1. Criar Imóvel
```
Form (GerenciamentoImoveis.tsx)
  ↓ handleSubmit() [async/await]
  ↓ Validação
  ↓ adicionarImovel() [Context]
  ↓ POST /api/imoveis
  ↓ Salva em portal_imobiliario.db
  ↓ Atualiza estado local
  ↓ Redireciona para /admin
```

### 2. Listar Imóveis
```
ImoveisContext.tsx
  ↓ useEffect() na inicialização
  ↓ GET /api/imoveis
  ↓ Retorna todas as propriedades ativas
  ↓ setImoveis() atualiza estado
  ↓ Sincroniza com Catalogo.tsx
```

### 3. Capturar Lead
```
DetalhesImovel.tsx
  ↓ enviarInteresse() [async/await]
  ↓ adicionarLead() [Context]
  ↓ POST /api/leads
  ↓ Salva em DB
  ↓ Envia email via Nodemailer
  ↓ Notifica usuário de sucesso
```

### 4. Adicionar Favorito
```
Catalogo.tsx / DetalhesImovel.tsx
  ↓ toggleFavorito()
  ↓ Salva em localStorage (não em DB)
  ↓ Persiste apenas na sessão
```

## ✨ Funcionalidades Implementadas

### ✅ Frontend
- [x] Catálogo com filtros (categoria, tipo, preço, quartos, bairro, cidade, estado)
- [x] Detalhes do imóvel com galeria de fotos
- [x] Sistema de favoritos
- [x] Captura de leads com validação
- [x] Painel administrativo com CRUD
- [x] Página de leads com visualização
- [x] Redirecionamento para WhatsApp
- [x] Formatação de moeda brasileira (R$)
- [x] Compressão de imagens em Base64

### ✅ Backend
- [x] API RESTful Express
- [x] Banco de dados SQLite com WAL
- [x] Endpoints CRUD para imoveis
- [x] Endpoints para leads
- [x] Autenticação de email Gmail
- [x] Envio automático de notificações
- [x] Validação de dados
- [x] Tratamento de erros

### ✅ Dados Persistentes
- [x] Imóveis salvos em BD
- [x] Leads salvos em BD
- [x] Fotos em Base64 (serializado em BD)
- [x] Dados consistentes após reiniciar servidor

## 🧪 Testes

### 1. Criar um Imóvel
1. Acesse http://localhost:5173/admin/imovel/novo
2. Preencha o formulário
3. Clique em "Salvar"
4. Verifique se redireciona para /admin
5. Atualize a página - o imóvel deve estar lá

### 2. Validar Persistência
1. Feche o navegador
2. Reinicie o servidor (`Ctrl+C` no terminal 1, depois `npm run server`)
3. Reabra http://localhost:5173
4. O imóvel criado deve estar visível

### 3. Capturar Lead
1. Acesse o catálogo
2. Clique em um imóvel
3. Clique em "Tenho Interesse"
4. Preencha o formulário
5. Clique em "Enviar"
6. Verifique:
   - Email foi recebido
   - Lead aparece em /admin/leads
   - Status "Visualizado" funcionando

### 4. Verificar Banco de Dados
```bash
# Instalar sqlite3 globalmente (opcional)
sqlite3 portal_imobiliario.db

# No prompt SQLite:
SELECT COUNT(*) FROM imoveis;
SELECT COUNT(*) FROM leads;
SELECT * FROM imoveis WHERE ativo = 1;
```

## 🐛 Troubleshooting

### Problema: "Cannot find module 'better-sqlite3'"
**Solução**: Reinstale as dependências
```bash
rm -rf node_modules package-lock.json
npm install
```

### Problema: Email não é enviado
**Verificação**:
1. Confirme as credenciais em `.env`
2. Gere uma nova senha de aplicativo no Gmail
3. Verifique se a conta permite aplicativos menos seguros
4. Veja logs do servidor: `npm run server`

### Problema: Frontend não conecta ao backend
**Verificação**:
1. Backend está rodando em `http://localhost:4000`?
2. `.env.local` tem `VITE_API_BASE_URL=http://localhost:4000`?
3. Verá error nos logs do navegador (F12)
4. Tente acessar `http://localhost:4000/health`

### Problema: Imóvel não salva ao clicar "Salvar"
**Verificação**:
1. Abra F12 (DevTools)
2. Vá para aba "Network"
3. Clique em "Salvar"
4. Veja a requisição POST /api/imoveis
5. Verifique o status (deve ser 200)
6. Veja resposta - há erro?

### Problema: Dados desaparecem após restart
**Causa**: Banco de dados não foi inicializado ou foi deletado
**Solução**: 
1. Exclua `portal_imobiliario.db`
2. Reinicie o servidor
3. Banco será recriado automaticamente

## 📊 Estrutura de Pastas

```
portal-imobiliario/
├── server/
│   ├── index.js           # Express + API endpoints
│   └── database.js        # SQLite schema + initialization
├── src/
│   ├── pages/
│   │   ├── Catalogo.tsx          # Listagem com filtros
│   │   ├── DetalhesImovel.tsx    # Detalhes + lead capture
│   │   ├── GerenciamentoImoveis.tsx  # CRUD admin
│   │   ├── Admin.tsx             # Dashboard admin
│   │   └── Leads.tsx             # Gerenciar leads
│   ├── contexts/
│   │   └── ImoveisContext.tsx    # State management + API calls
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── utils/
│       └── helpers.ts            # Funções utilitárias
├── .env                   # Credenciais backend
├── .env.local            # API URL frontend
├── package.json          # Dependências
├── tsconfig.json         # TypeScript config
├── tailwind.config.js    # Tailwind CSS config
└── portal_imobiliario.db # SQLite database (gerado automaticamente)
```

## 🔐 Segurança

⚠️ **Importante**: Nunca commite arquivos sensíveis:
- `.env` (adicione ao `.gitignore`)
- `portal_imobiliario.db`
- `.env.local`

✅ Já configurado no projeto com `.gitignore`

## 📝 Próximos Passos

1. **Customização**:
   - Adicione seu logo
   - Customize cores em `tailwind.config.js`
   - Modifique campos de imóvel em `src/types/index.ts`

2. **Deploy**:
   - Frontend: Vercel, Netlify
   - Backend: Railway, Heroku, DigitalOcean
   - BD: Migre para PostgreSQL/MySQL para produção

3. **Melhorias**:
   - Autenticação de usuários
   - Upload de fotos em cloud (AWS S3, Cloudinary)
   - Relatórios e analytics
   - Integração com CRM

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no terminal
2. Abra o DevTools do navegador (F12)
3. Verifique aba "Console" e "Network"
4. Procure mensagens de erro no servidor

## ✅ Status Final

🎉 Sistema 100% funcional com:
- ✅ Persistência de dados em SQLite
- ✅ API RESTful integrada
- ✅ Frontend synced com backend
- ✅ Envio de emails automático
- ✅ Sistema de leads funcional
- ✅ Sem perda de dados no restart
