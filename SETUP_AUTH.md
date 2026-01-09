# 🔐 Configuração de Autenticação - Finança iOS PWA

Este guia explica como configurar a autenticação com Supabase no projeto.

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase
3. Node.js instalado (v20+ recomendado)

## 🚀 Passo a Passo

### 1. Configurar o Supabase

#### 1.1. Criar projeto no Supabase
- Acesse [supabase.com](https://supabase.com)
- Clique em "New Project"
- Escolha um nome e senha para o banco de dados
- Aguarde a criação do projeto (2-3 minutos)

#### 1.2. Executar o script SQL
- No dashboard do Supabase, vá em **SQL Editor**
- Clique em "New Query"
- Copie todo o conteúdo do arquivo `supabase_setup.sql`
- Cole no editor e clique em "Run"
- Isso criará as tabelas necessárias para autenticação

#### 1.3. Obter as credenciais
- No dashboard, vá em **Settings** → **API**
- Copie os seguintes valores:
  - **Project URL** (ex: `https://xxxxx.supabase.co`)
  - **anon public** key (chave longa que começa com `eyJ...`)

### 2. Configurar Variáveis de Ambiente

#### 2.1. Criar arquivo `.env.local`
Na raiz do projeto, crie um arquivo chamado `.env.local`:

```bash
# Google Gemini AI
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui

# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:** 
- Substitua os valores pelos seus dados reais
- Nunca commite o arquivo `.env.local` no Git
- O arquivo `.env.example` serve apenas como referência

#### 2.2. Obter chave do Gemini (opcional)
Se quiser usar a funcionalidade de IA:
- Acesse [ai.google.dev](https://ai.google.dev)
- Crie uma API Key
- Cole no campo `VITE_GEMINI_API_KEY`

### 3. Instalar Dependências e Rodar

```bash
# Instalar dependências (se ainda não instalou)
npm install

# Rodar em desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:3000`

## 🎨 Funcionalidades Implementadas

### ✅ Autenticação
- [x] Tela de Login/Registro com design glassmorphism
- [x] Cadastro de novos usuários
- [x] Login com email e senha
- [x] Verificação de sessão automática
- [x] Logout funcional
- [x] Proteção de rotas (só acessa o app se estiver logado)

### ✅ Perfil de Usuário
- [x] Criação automática de perfil no signup
- [x] Avatar gerado automaticamente (DiceBear)
- [x] Nome e email salvos no Supabase
- [x] Substituição do `CURRENT_USER` mockado

### ✅ Integração
- [x] AuthContext para gerenciar estado global
- [x] Supabase Client configurado
- [x] Variáveis de ambiente com Vite
- [x] Loading states durante autenticação

## 🔒 Segurança

### Row Level Security (RLS)
O script SQL já configura políticas de segurança:
- Usuários só podem ver/editar seu próprio perfil
- Dados isolados por usuário
- Proteção contra acesso não autorizado

### Variáveis de Ambiente
- Nunca exponha suas chaves no código
- Use `.env.local` para desenvolvimento
- No Netlify, configure as variáveis no Dashboard

## 📱 Deploy no Netlify

### Configurar Variáveis de Ambiente
1. Acesse seu projeto no Netlify Dashboard
2. Vá em **Site settings** → **Environment variables**
3. Adicione as 3 variáveis:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Build Settings
```
Build command: npm run build
Publish directory: dist
```

## 🐛 Troubleshooting

### Erro: "Missing Supabase environment variables"
- Verifique se o arquivo `.env.local` existe
- Confirme que as variáveis começam com `VITE_`
- Reinicie o servidor de desenvolvimento

### Erro: "Invalid API key"
- Verifique se copiou a chave **anon public** (não a service_role)
- Confirme que a URL está correta (com https://)

### Usuário não consegue fazer login
- Verifique se o script SQL foi executado
- Confirme que a tabela `profiles` existe no Supabase
- Veja os logs no console do navegador

### Email de confirmação não chega
Por padrão, Supabase envia email de confirmação. Para desabilitar em desenvolvimento:
1. Vá em **Authentication** → **Settings**
2. Desative "Enable email confirmations"

## 📚 Próximos Passos

Agora que a autenticação está funcionando, você pode:

1. **Migrar dados do localStorage para Supabase**
   - Usar as tabelas `transactions`, `budgets`, etc.
   - Implementar queries no `storageService`

2. **Implementar sistema de famílias**
   - Criar/entrar em grupos familiares
   - Compartilhar transações entre membros

3. **Adicionar funcionalidades**
   - Recuperação de senha
   - Atualização de perfil
   - Upload de avatar personalizado

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs do console do navegador (F12)
2. Veja os logs do Supabase Dashboard
3. Confirme que todas as variáveis estão corretas

---

**Desenvolvido com ❤️ usando React 19, Supabase e Vite**
