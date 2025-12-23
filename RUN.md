# 🚀 COMANDOS PARA EXECUTAR - Portal Imobiliário

## ⚡ Forma Mais Rápida (Recomendada)

### Abra DOIS terminais diferentes

**TERMINAL 1 - Backend (Express na porta 4000)**
```bash
npm run server
```

Você verá:
```
Servidor rodando em http://localhost:4000
Banco de dados inicializado ✓
SMTP conectado ✓
```

---

**TERMINAL 2 - Frontend (React/Vite na porta 5173)**
```bash
npm run dev
```

Você verá:
```
VITE v5.0.8  ready in 123ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

---

**Navegador - Acesse**
```
http://localhost:5173
```

---

## ✅ Pronto!

Você está com:
- ✅ Backend rodando em `http://localhost:4000`
- ✅ Frontend rodando em `http://localhost:5173`
- ✅ Banco de dados SQLite inicializado
- ✅ Emails configurados

---

## 🧪 Teste Rápido (2 minutos)

1. **Acesse** `http://localhost:5173`
2. **Clique** em `/admin` (ou clique no menu)
3. **Clique** em "Novo Imóvel"
4. **Preencha** apenas campos obrigatórios:
   - Categoria: Casa
   - Tipo: Casa
   - Título: Casa de teste
   - Descrição: Teste
   - Preço: 100000
   - Logradouro: Rua teste
   - Número: 123
   - Bairro: Centro
   - Cidade: Sua cidade
   - Estado: MG
   - Adicione 4 fotos (qualquer imagem)
5. **Clique** em "Salvar"
6. **Aguarde** o redirecionamento para `/admin` ← Isso prova async/await funcionando!
7. **Feche** navegador
8. **Ctrl+C** no terminal do servidor
9. **`npm run server`** novamente
10. **Reabra** `http://localhost:5173`
11. **Veja que a casa continua lá!** ← Isso prova persistência SQLite! ✅

---

## 🎯 Estrutura dos Terminais

```
Your Computer
    ├── Terminal 1
    │   └── npm run server
    │       └── Port 4000 (Express)
    │
    └── Terminal 2
        └── npm run dev
            └── Port 5173 (React)
```

---

## 🔧 Se Algo Não Funcionar

### Backend não inicia
```bash
# Limpe e reinstale
rm -rf node_modules package-lock.json
npm install
npm run server
```

### Frontend não conecta ao backend
```bash
# Confirme que:
# 1. Backend está rodando em Terminal 1
# 2. .env.local tem: VITE_API_BASE_URL=http://localhost:4000
# 3. Abra DevTools (F12) e veja console para erros
```

### Banco de dados corrompido
```bash
# Delete e deixe recriar
rm portal_imobiliario.db
npm run server  # Vai recriar automaticamente
```

---

## 📊 Verificar Saúde do Sistema

### Verifique Backend
```
http://localhost:4000/health
```

Deve retornar:
```json
{
  "status": "ok",
  "smtp": "connected",
  "db": "connected"
}
```

---

## 📝 Logs Importantes

### No Terminal 1 (Backend), procure por:
```
✓ Servidor rodando em http://localhost:4000
✓ Banco de dados inicializado
✓ POST /api/imoveis
✓ GET /api/imoveis
```

### No Terminal 2 (Frontend), procure por:
```
✓ VITE ready
✓ Local: http://localhost:5173
```

### No DevTools do Navegador (F12):
```
✓ Network: POST /api/imoveis → Status 200
✓ Console: Sem erros vermelho
```

---

## 🎯 O Que Você Pode Fazer

1. **Criar Imóvel** → `/admin/imovel/novo`
2. **Listar Imóveis** → `/` (Catálogo)
3. **Ver Detalhes** → Clique em imóvel no catálogo
4. **Editar** → `/admin` → Clique "Editar"
5. **Deletar** → `/admin` → Clique ícone lixo
6. **Gerar Lead** → Catálogo → "Tenho Interesse"
7. **Ver Leads** → `/admin/leads`
8. **Marcar Lido** → `/admin/leads` → "Marcar como Visualizado"

---

## ✨ Recursos Funcionando

- ✅ Criar/Editar/Deletar imóveis
- ✅ Dados persistem em SQLite
- ✅ Catálogo com filtros
- ✅ Favoritos (localStorage)
- ✅ Captura de leads
- ✅ Envio de emails
- ✅ Marcar lead como visualizado

---

## 🎉 Pronto!

Agora é só aproveitar seu portal imobiliário 100% funcional!

```
Terminal 1:  npm run server
Terminal 2:  npm run dev
Browser:     http://localhost:5173
```

**Bom uso! 🚀**
