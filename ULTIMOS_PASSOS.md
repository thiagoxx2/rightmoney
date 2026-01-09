# ✅ Configuração do Supabase Completa!

## 🎉 O que já está configurado:

✅ Arquivo `.env.local` criado  
✅ URL do Supabase: `https://ecremokycjxbtbmjwsdc.supabase.co`  
✅ ANON KEY configurada  
✅ Projeto pronto para rodar  

---

## 🚀 PRÓXIMOS PASSOS (Faça AGORA):

### 1️⃣ Executar o Script SQL no Supabase (2 minutos)

**IMPORTANTE:** Crie as tabelas no banco de dados:

#### Passo a passo:
1. Acesse o dashboard do Supabase: https://supabase.com/dashboard/project/ecremokycjxbtbmjwsdc
2. No menu lateral, clique em **SQL Editor** 📝
3. Clique em **New Query**
4. Abra o arquivo `supabase_setup.sql` deste projeto
5. Copie **TODO** o conteúdo do arquivo
6. Cole no SQL Editor
7. Clique em **Run** (botão ▶️ verde)
8. Aguarde até aparecer **"Success. No rows returned"**

**O que esse script faz:**
- Cria a tabela `profiles` para armazenar dados dos usuários
- Configura Row Level Security (RLS) para segurança
- Cria políticas de acesso
- Prepara tabelas futuras (transactions, budgets, family_groups)

---

### 2️⃣ Testar Localmente (1 minuto)

```bash
npm run dev
```

O app vai abrir em: http://localhost:3000

---

### 3️⃣ Criar sua Primeira Conta (30 segundos)

1. O app vai carregar mostrando a tela de login
2. Clique em **"Criar Conta"**
3. Preencha:
   - **Nome:** Seu nome
   - **Email:** seu@email.com
   - **Senha:** mínimo 6 caracteres
4. Clique em **"Criar Conta"**
5. ✅ Pronto! Você será redirecionado para o dashboard

---

## 🎯 O que você deve ver:

### Tela de Login (primeira vez)
```
┌────────────────────────────────────┐
│           💎 Finança              │
│       Controle Familiar           │
├────────────────────────────────────┤
│  [Entrar]  [Criar Conta]         │
│                                   │
│  Nome: ___________________        │
│  Email: __________________        │
│  Senha: __________________        │
│                                   │
│  [ Criar Conta ]                  │
└────────────────────────────────────┘
```

### Dashboard (após login)
```
┌────────────────────────────────────┐
│  Residência Silva        [Logout]  │
│  Visão Geral                       │
├────────────────────────────────────┤
│  Saldo Familiar: R$ 0,00          │
│                                   │
│  💎 Consultoria IA                │
│  📊 Performance Familiar          │
│  📈 Fluxo de Gastos              │
│  🎯 Categorias                    │
│                                   │
│  [+] Adicionar Transação          │
└────────────────────────────────────┘
```

---

## ✅ Checklist de Teste:

- [ ] Script SQL executado no Supabase
- [ ] `npm run dev` rodando sem erros
- [ ] Tela de login apareceu
- [ ] Consegui criar uma conta
- [ ] Fui redirecionado para o dashboard
- [ ] Vejo meu nome no cabeçalho
- [ ] Consigo adicionar uma transação
- [ ] Consigo fazer logout
- [ ] Consigo fazer login novamente

---

## 🐛 Se algo der errado:

### Erro: "Missing Supabase environment variables"
```bash
# Verifique se o .env.local existe:
cat .env.local

# Se não mostrar nada, me avise
```

### Erro: "relation public.profiles does not exist"
- Você precisa executar o script `supabase_setup.sql` no SQL Editor do Supabase
- Vá em: https://supabase.com/dashboard/project/ecremokycjxbtbmjwsdc/sql

### Erro: "Invalid API key"
- Verifique se a ANON KEY está correta no `.env.local`
- Reinicie o servidor: `Ctrl+C` e `npm run dev`

### App não carrega/tela branca
```bash
# Verifique erros no console:
# Abra o navegador em http://localhost:3000
# Pressione F12 (DevTools)
# Vá na aba "Console"
# Copie os erros e me envie
```

---

## 🚀 Após Testar Localmente - Deploy no Netlify:

Quando tudo estiver funcionando localmente, siga estes passos:

### Opção 1: Deploy via Git (Recomendado)

1. **Criar repositório no GitHub:**
   ```bash
   git init
   git add .
   git commit -m "feat: add authentication with supabase"
   git branch -M main
   git remote add origin seu-repo-github
   git push -u origin main
   ```

2. **Conectar ao Netlify:**
   - Acesse https://app.netlify.com
   - Clique em "Add new site" → "Import an existing project"
   - Conecte com GitHub
   - Selecione o repositório
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Clique em "Deploy site"

3. **Configurar variáveis de ambiente no Netlify:**
   - Vá em "Site settings" → "Environment variables"
   - Adicione:
     ```
     VITE_SUPABASE_URL=https://ecremokycjxbtbmjwsdc.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     VITE_GEMINI_API_KEY= (se tiver)
     ```
   - Faça redeploy

### Opção 2: Deploy Manual

```bash
# Build local
npm run build

# No Netlify:
# - Arraste a pasta "dist" para o site
# - Configure as variáveis de ambiente
# - Pronto!
```

---

## 🔐 Configurar Supabase para Produção:

Após fazer deploy no Netlify:

1. Copie a URL do seu site (ex: `https://seu-app.netlify.app`)
2. Vá no Supabase: https://supabase.com/dashboard/project/ecremokycjxbtbmjwsdc/auth/url-configuration
3. Em **"Site URL"**, adicione: `https://seu-app.netlify.app`
4. Em **"Redirect URLs"**, adicione: `https://seu-app.netlify.app/**`

---

## 📊 Status do Projeto:

| Item | Status |
|------|--------|
| ✅ Autenticação | 100% Completo |
| ✅ Supabase | Configurado |
| ✅ .env.local | Criado |
| ⏳ Script SQL | **→ EXECUTE AGORA** |
| ⏳ Teste Local | **→ FAÇA AGORA** |
| ⏳ Deploy | Aguardando |

---

## 🎊 Próximo Comando:

```bash
npm run dev
```

**Abra:** http://localhost:3000  
**Crie uma conta e teste!** 🚀

---

**Dúvidas?** Me avise se precisar de ajuda! 🙋‍♂️
