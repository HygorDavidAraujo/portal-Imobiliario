# ⚡ Guia Rápido de Deploy - Railway + Vercel

## 🚀 Deploy em 10 Minutos

### Passo 1: Preparação (2 min)

```bash
# Instale PostgreSQL driver
npm install pg

# Commit tudo
git add .
git commit -m "feat: preparar para deploy railway"
git push origin main
```

### Passo 2: Railway - Backend (4 min)

1. **Acesse**: https://railway.app
2. **Login** com GitHub
3. **New Project** → Deploy from GitHub repo
4. **Selecione** seu repositório
5. **Add PostgreSQL**:
   - Clique "+ New"
   - Database → PostgreSQL
   - Aguarde provisionar
6. **Configure Variáveis** (Settings → Variables):
   ```
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=465
   MAIL_USER=seu-email@gmail.com
   MAIL_PASS=sua-senha-app
   NODE_ENV=production
   ```
7. **Copie a URL**: `https://seu-projeto.railway.app`

### Passo 3: Vercel - Frontend (4 min)

1. **Acesse**: https://vercel.com
2. **Login** com GitHub
3. **Import Repository**
4. **Configure**:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Adicione variável**:
   ```
   VITE_API_BASE_URL=https://seu-projeto.railway.app
   ```
6. **Deploy!**

### Passo 4: Teste (1 min)

1. Abra sua URL Vercel
2. Crie um imóvel
3. Verifique se salva
4. ✅ **Funcionando!**

---

## 🎯 Checklist Rápido

- [ ] `npm install pg` executado
- [ ] PostgreSQL adicionado no Railway
- [ ] Variáveis de email configuradas
- [ ] URL do Railway copiada
- [ ] Frontend deployado no Vercel
- [ ] `VITE_API_BASE_URL` configurada
- [ ] Teste criando imóvel
- [ ] ✅ Tudo funcionando!

---

## ⚠️ Atenção

### Railway
- **DATABASE_URL** é gerado automaticamente
- Não precisa criar manualmente
- Banco PostgreSQL é GRÁTIS

### Vercel  
- **Não esqueça** de adicionar `VITE_API_BASE_URL`
- Use a URL do Railway (com https://)
- Deploy é GRÁTIS

---

## 🆘 Problemas Comuns

### Backend não inicia
```bash
# Ver logs
railway logs

# Reinstalar dependências
railway run npm install
```

### Frontend não conecta
- Verifique `VITE_API_BASE_URL` no Vercel
- Confirme URL do Railway está correta
- Redeploy no Vercel

### CORS Error
- Adicione URL do Vercel nas variáveis do Railway:
  ```
  FRONTEND_URL=https://seu-dominio.vercel.app
  ```

---

## 📊 Resultado Final

```
seu-dominio.vercel.app (Frontend)
    ↓ API calls
seu-projeto.railway.app (Backend)
    ↓ Database
PostgreSQL (Railway)
```

---

## 🎉 Pronto!

Seu portal está no ar em produção!

**Frontend**: https://seu-dominio.vercel.app
**Backend**: https://seu-projeto.railway.app
**Database**: PostgreSQL (Railway)

---

## 📚 Documentação Completa

Para mais detalhes, leia:
- [DEPLOY_RAILWAY.md](DEPLOY_RAILWAY.md) - Guia completo
