# 🚨 AÇÃO NECESSÁRIA - Completar Configuração

## ✅ O que já foi feito:
- Arquivo `.env.local` criado
- URL do Supabase configurada: `https://ecremokycjxbtbmjwsdc.supabase.co`

## ⚠️ O que VOCÊ precisa fazer AGORA:

### 1. Obter a ANON KEY (2 minutos)

#### Passo a passo:
1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto (ecremokycjxbtbmjwsdc)
3. No menu lateral, clique em **Settings** (⚙️)
4. Clique em **API**
5. Procure a seção **Project API keys**
6. Copie o valor de **anon public** (é uma string longa que começa com `eyJ...`)
   
   **⚠️ NÃO copie a service_role! Use apenas a anon public!**

#### Exemplo do que você vai copiar:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcmVtb2t5Y2p4YnRibWp3c2RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.abc123...
```
(Sua chave será diferente, mas terá esse formato)

### 2. Adicionar no arquivo `.env.local`

Abra o arquivo `.env.local` que acabei de criar e cole a ANON KEY:

**Antes:**
```env
VITE_SUPABASE_ANON_KEY=
```

**Depois:**
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sua_chave_aqui...
```

### 3. (Opcional) Adicionar chave do Gemini para IA

Se quiser usar a funcionalidade de análise financeira com IA:
1. Acesse https://ai.google.dev/
2. Clique em "Get API Key"
3. Copie a chave e cole no `.env.local`:

```env
VITE_GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnop
```

### 4. Executar o script SQL no Supabase

**IMPORTANTE:** Crie as tabelas necessárias no banco:

1. No dashboard do Supabase, vá em **SQL Editor** (no menu lateral)
2. Clique em **New Query**
3. Abra o arquivo `supabase_setup.sql` deste projeto
4. Copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** (▶️)
7. Aguarde até aparecer "Success. No rows returned"

### 5. Testar localmente

```bash
npm run dev
```

Acesse http://localhost:3000 e tente:
- Criar uma nova conta
- Fazer login
- Navegar pelo app

---

## 📍 Onde estão os arquivos:

```
/finança-ios-pwa/
├── .env.local          ← Arquivo criado, precisa da ANON KEY
├── supabase_setup.sql  ← Copie e execute no Supabase
└── [outros arquivos]
```

---

## 🆘 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se adicionou a ANON KEY no `.env.local`
- Reinicie o servidor (`Ctrl+C` e `npm run dev`)

### Erro: "Invalid API key"
- Certifique-se de copiar a chave **anon public** (não a service_role)
- Verifique se não há espaços extras

### Erro ao criar conta: "relation public.profiles does not exist"
- Execute o script `supabase_setup.sql` no SQL Editor do Supabase

---

## ✅ Checklist Rápido:

- [ ] Acessei o Supabase Dashboard
- [ ] Copiei a ANON KEY (anon public)
- [ ] Colei no arquivo `.env.local`
- [ ] Executei o script `supabase_setup.sql` no SQL Editor
- [ ] Rodei `npm run dev`
- [ ] Testei criar uma conta
- [ ] Testei fazer login
- [ ] **App funcionando!** 🎉

---

## 🚀 Após Testar Localmente:

Quando tudo estiver funcionando localmente, siga o `CHECKLIST_DEPLOY.md` para fazer deploy no Netlify.

**Lembre-se:** No Netlify, você vai precisar adicionar as mesmas 3 variáveis no Dashboard (não usa o arquivo `.env.local`).

---

**Precisa de ajuda?** Me avise se encontrar algum erro! 🙋‍♂️
