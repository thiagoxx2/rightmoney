# 🚀 Checklist para Deploy no Netlify

## ✅ Autenticação (Completo)
- [x] Pacote `@supabase/supabase-js` instalado
- [x] Cliente Supabase configurado (`services/supabase.ts`)
- [x] AuthContext implementado
- [x] Tela de Login/Registro criada
- [x] Verificação de sessão funcionando
- [x] Logout implementado
- [x] CURRENT_USER mockado substituído
- [x] Build testado e funcionando

## 📋 Antes do Deploy

### 1. Configurar Supabase
- [x] Criar projeto no Supabase
- [x] Executar script `supabase_schema.sql` no SQL Editor
- [x] Copiar Project URL
- [x] Copiar anon public key

### 2. Configurar Variáveis de Ambiente Localmente
- [x] Criar arquivo `.env.local` na raiz do projeto
- [x] Adicionar `VITE _SUPABASE_URL`
- [x] Adicionar `VITE_SUPABASE_ANON_KEY`
- [ ] Adicionar `VITE_GEMINI_API_KEY` (opcional, para IA)
- [x] Testar localmente com `npm run dev`

### 3. Preparar para Deploy
- [x] Testar build: `npm run build`
- [x] Verificar se pasta `dist` foi criada
- [x] Confirmar que não há erros no build

## 🌐 Deploy no Netlify

### Opção A: Deploy via Git (Recomendado)

1. **Preparar Repositório**
   - [x] Criar repositório no GitHub/GitLab
   - [x] Fazer commit de todos os arquivos
   - [x] Push para o repositório

2. **Conectar ao Netlify**
   - [ ] Acessar [netlify.com](https://netlify.com)
   - [ ] Clicar em "Add new site" → "Import an existing project"
   - [ ] Conectar com GitHub/GitLab
   - [ ] Selecionar o repositório

3. **Configurar Build**
   - [ ] Build command: `npm run build`
   - [ ] Publish directory: `dist`
   - [ ] Clicar em "Deploy site"

4. **Adicionar Variáveis de Ambiente**
   - [ ] Ir em "Site settings" → "Environment variables"
   - [ ] Adicionar `VITE_SUPABASE_URL`
   - [ ] Adicionar `VITE_SUPABASE_ANON_KEY`
   - [ ] Adicionar `VITE_GEMINI_API_KEY`
   - [ ] Fazer redeploy: "Deploys" → "Trigger deploy" → "Deploy site"

### Opção B: Deploy Manual (Drag & Drop)

1. **Build Local**
   - [ ] Executar `npm run build`
   - [ ] Verificar pasta `dist`

2. **Upload no Netlify**
   - [ ] Acessar [netlify.com](https://netlify.com)
   - [ ] Arrastar pasta `dist` para área de upload
   - [ ] Aguardar deploy

3. **Configurar Variáveis de Ambiente**
   - [ ] Ir em "Site settings" → "Environment variables"
   - [ ] Adicionar todas as variáveis
   - [ ] Fazer novo upload da pasta `dist`

## 🔧 Configurações Adicionais no Netlify

### Configurar Redirects (Importante para SPA)
- [ ] Criar arquivo `public/_redirects` com conteúdo:
```
/*    /index.html   200
```
- [ ] Ou adicionar em `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Configurar Headers de Segurança (Opcional)
- [ ] Adicionar em `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
```

## ✅ Pós-Deploy

### Testar Funcionalidades
- [ ] Acessar URL do Netlify
- [ ] Testar cadastro de novo usuário
- [ ] Testar login
- [ ] Testar logout
- [ ] Verificar se transações são salvas
- [ ] Testar navegação entre abas
- [ ] Testar em dispositivo móvel

### Configurar Domínio (Opcional)
- [ ] Ir em "Domain settings"
- [ ] Adicionar domínio customizado
- [ ] Configurar DNS

### Configurar Supabase para Produção
- [ ] Em Supabase: "Authentication" → "URL Configuration"
- [ ] Adicionar URL do Netlify em "Site URL"
- [ ] Adicionar URL em "Redirect URLs"

## 🐛 Troubleshooting

### Se o app não carregar:
- [ ] Verificar console do navegador (F12)
- [ ] Confirmar que variáveis de ambiente estão configuradas
- [ ] Verificar se build foi bem-sucedido
- [ ] Checar logs do Netlify

### Se autenticação não funcionar:
- [ ] Verificar se script SQL foi executado no Supabase
- [ ] Confirmar que variáveis estão corretas
- [ ] Verificar se URL do Netlify está nas Redirect URLs do Supabase

### Se aparecer erro 404:
- [ ] Adicionar arquivo `_redirects` ou `netlify.toml`
- [ ] Fazer redeploy

## 📱 PWA (Próximo Passo)

Para transformar em PWA instalável:
- [ ] Criar `manifest.json`
- [ ] Adicionar ícones (192x192, 512x512)
- [ ] Implementar Service Worker
- [ ] Testar instalação no celular

## 🎉 Checklist Final

- [ ] ✅ Autenticação funcionando
- [ ] ✅ Deploy realizado
- [ ] ✅ Variáveis configuradas
- [ ] ✅ Testes passando
- [ ] ✅ URL compartilhável
- [ ] 🎊 **Projeto no ar!**

---

**Dica:** Marque cada item conforme for completando. Boa sorte com o deploy! 🚀
