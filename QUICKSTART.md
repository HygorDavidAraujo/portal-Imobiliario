# ⚡ Quick Start - Portal Imobiliário

## 🚀 Início Rápido (2 minutos)

### 1. Instalar Dependências
```bash
npm install
```

### 2. Terminal 1 - Backend
```bash
npm run server
```

Você verá:
```
Servidor rodando em http://localhost:4000
Banco de dados inicializado ✓
```

### 3. Terminal 2 - Frontend  
```bash
npm run dev
```

Você verá:
```
➜  Local:   http://localhost:5173/
```

### 4. Abrir no Navegador
```
http://localhost:5173
```

---

## ✅ Tudo Pronto!

### Agora você pode:
- 📝 **Criar imóveis** em `/admin/imovel/novo`
- 🔍 **Visualizar catálogo** em `/`
- 📋 **Gerenciar** em `/admin`
- 📞 **Ver leads** em `/admin/leads`

---

## 🧪 Teste Rápido

1. **Criar imóvel**: `/admin/imovel/novo` → preencher → salvar
2. **Feche navegador e reinicie servidor**
3. **Reabra navegador** → imóvel continua lá ✅

---

## ❓ Problemas?

### Backend não inicia
```bash
# Reinstale dependências
rm -rf node_modules package-lock.json
npm install
npm run server
```

### Frontend não conecta
- Confirme `.env.local` tem: `VITE_API_BASE_URL=http://localhost:4000`
- Veja console (F12) para erros

### Email não funciona
- Confirme `.env` tem credenciais Gmail corretas
- Gere nova senha de app em myaccount.google.com/apppasswords

---

## 📚 Documentação Completa

- **SETUP.md** - Guia completo (15 min)
- **CHECKLIST.md** - Validação (10 min)
- **RESUMO_IMPLEMENTACAO.md** - Visão geral (5 min)

---

## 🎯 Status

✅ **100% Funcional**
- ✅ Dados persistem em SQLite
- ✅ API integrada
- ✅ Emails automáticos
- ✅ Sem bugs críticos

---

## 🚀 Go!

```bash
npm run server &
npm run dev &
# Abra http://localhost:5173
```

**Pronto! 🎉**
