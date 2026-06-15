# 🔑 Como Configurar as Variáveis de Ambiente

## Para Desenvolvimento Local

### Passo 1: Criar arquivo `.env.local`

Na **raiz do projeto** (mesma pasta do `package.json`), crie um arquivo chamado `.env.local`:

```bash
# No terminal, na pasta do projeto:
touch .env.local
```

Ou crie manualmente com seu editor de código.

### Passo 2: Adicionar as credenciais

Abra o arquivo `.env.local` e adicione:

```env
# Google Gemini AI (opcional - para funcionalidade de IA)
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui

# Supabase (obrigatório - para autenticação)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sua_chave_aqui
```

### Passo 3: Substituir pelos seus valores

#### Onde encontrar as credenciais do Supabase:

1. **Acesse seu projeto no Supabase:**
   - Vá para [supabase.com](https://supabase.com)
   - Faça login
   - Selecione seu projeto

2. **Copie a URL do projeto:**
   - No menu lateral, clique em **Settings** (⚙️)
   - Clique em **API**
   - Copie o valor de **Project URL**
   - Exemplo: `https://abcdefghijk.supabase.co`

3. **Copie a chave anon:**
   - Na mesma página (Settings → API)
   - Procure por **Project API keys**
   - Copie o valor de **anon public** (NÃO use a service_role!)
   - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (é uma chave longa)

#### Onde encontrar a chave do Gemini (opcional):

1. Acesse [ai.google.dev](https://ai.google.dev)
2. Clique em "Get API Key"
3. Copie a chave gerada

### Exemplo de `.env.local` preenchido:

```env
# Google Gemini AI
VITE_GEMINI_API_KEY=AIzaSyB1234567890abcdefghijklmnop

# Supabase
VITE_SUPABASE_URL=https://xyzabcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### Passo 4: Testar

```bash
npm run dev
```

Se tudo estiver correto, o app vai carregar sem erros.

---

## Para Deploy no Netlify

### Não use arquivo `.env.local` no Netlify!

As variáveis devem ser configuradas no **Dashboard do Netlify**.

### Passo 1: Acessar configurações

1. Faça login no [netlify.com](https://netlify.com)
2. Selecione seu site
3. Vá em **Site settings**
4. Clique em **Environment variables** (no menu lateral)

### Passo 2: Adicionar variáveis

Clique em **Add a variable** e adicione uma por uma:

#### Variável 1:
- **Key:** `VITE_GEMINI_API_KEY`
- **Value:** `sua_chave_gemini`
- Clique em **Create variable**

#### Variável 2:
- **Key:** `VITE_SUPABASE_URL`
- **Value:** `https://seu-projeto.supabase.co`
- Clique em **Create variable**

#### Variável 3:
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Clique em **Create variable**

### Passo 3: Fazer redeploy

Após adicionar as variáveis:
1. Vá em **Deploys**
2. Clique em **Trigger deploy**
3. Selecione **Deploy site**
