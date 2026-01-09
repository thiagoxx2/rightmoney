# 🚀 Executar SQL das Tabelas Restantes

## 📋 O que este SQL faz

Cria as tabelas restantes baseadas no seu schema Prisma:

1. ✅ `transactions` — Transações financeiras
2. ✅ `family_groups` — Grupos familiares
3. ✅ `family_members` — Membros da família
4. ✅ `budgets` — Orçamentos por categoria

---

## 🎯 Características implementadas

### Transactions
- Suporta uso **individual** (`family_id` NULL) e **familiar**
- Índices otimizados para queries rápidas
- RLS: usuário vê só suas transações + transações da família

### Family Groups
- Código de convite único gerado automaticamente
- Sistema de admin/member
- RLS: membros veem só grupos que pertencem

### Budgets
- Suporta orçamento **individual** e **familiar**
- Um orçamento por categoria por usuário/família
- RLS: usuário vê seus orçamentos + orçamentos da família

---

## 📝 Como executar

### 1. Acesse o SQL Editor do Supabase

https://supabase.com/dashboard/project/ecremokycjxbtbmjwsdc/sql

### 2. Crie uma nova query

Clique em **"New Query"**

### 3. Cole o conteúdo do arquivo

Abra o arquivo: `create_remaining_tables.sql`

Copie **TODO** o conteúdo e cole no SQL Editor

### 4. Execute

Clique em **Run** (▶️)

Aguarde até aparecer **"Success"** no final

---

## ✅ O que deve aparecer ao final

```
Success. No rows returned

Resultado da verificação:
┌────────────────┬───────┐
│ table_name     │ count │
├────────────────┼───────┤
│ profiles       │ 1     │ ← Seu perfil
│ transactions   │ 0     │
│ family_groups  │ 0     │
│ family_members │ 0     │
│ budgets        │ 0     │
└────────────────┴───────┘
```

---

## 🔍 Verificar se funcionou

### No Supabase Dashboard

1. Vá em **Table Editor** (menu lateral)
2. Deve ver as novas tabelas listadas:
   - ✅ profiles (já existia)
   - ✅ transactions (nova)
   - ✅ family_groups (nova)
   - ✅ family_members (nova)
   - ✅ budgets (nova)

### Teste rápido no SQL Editor

Execute este comando para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'transactions', 'family_groups', 'family_members', 'budgets')
ORDER BY table_name;
```

Deve retornar 5 linhas.

---

## 🎨 Diferenças importantes do SQL atual

### 1. `family_id` opcional em transactions
```sql
-- ✅ NOVO: family_id pode ser NULL (uso individual)
family_id UUID REFERENCES public.family_groups(id)

-- ❌ ANTIGO: family_id era obrigatório
family_id UUID NOT NULL REFERENCES public.family_groups(id)
```

### 2. Budgets suporta individual e familiar
```sql
-- Pode ter:
user_id NOT NULL, family_id NULL  -- orçamento individual
user_id NULL, family_id NOT NULL  -- orçamento familiar
```

### 3. Categorias sem CHECK constraint (flexível)
```sql
-- ✅ NOVO: category é TEXT livre (compatível com o código atual)
category TEXT NOT NULL

-- Você pode adicionar CHECK constraint depois se quiser:
-- CHECK (category IN ('Salário', 'Mercado', ...))
```

### 4. Índices otimizados
- Índices simples para queries básicas
- Índices compostos para queries comuns (ex: user_id + date)

### 5. RLS completo e seguro
- Políticas para SELECT, INSERT, UPDATE, DELETE
- Usuários veem só seus dados + dados da família
- Admins têm permissões extras

---

## 🔧 Funções úteis incluídas

### `generate_join_code()`
Gera código de convite único para grupos familiares:
```sql
SELECT public.generate_join_code();
-- Retorna: 'A1B2C3D4'
```

### `create_default_family_for_new_user()` (opcional)
Trigger comentado que cria grupo familiar automaticamente ao cadastrar.

Para ativar, descomente no SQL:
```sql
CREATE TRIGGER create_family_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_family_for_new_user();
```

---

## 🚨 Se der erro

### Erro: "relation already exists"
As tabelas já foram criadas. Tudo OK!

### Erro: "function handle_updated_at does not exist"
Execute o script original `supabase_setup.sql` primeiro (cria essa função).

### Erro: "permission denied"
Verifique se está usando a conta correta do Supabase.

---

## 📊 Compatibilidade com o código atual

Este SQL é 100% compatível com o código atual:

| Código Atual | SQL |
|--------------|-----|
| `userId: string` | `user_id UUID` ✅ |
| `type: 'income' \| 'expense'` | `type TEXT CHECK (...)` ✅ |
| `category: string` | `category TEXT` ✅ |
| `amount: number` | `amount DECIMAL(10, 2)` ✅ |
| `date: string` | `date TIMESTAMP` ✅ |

---

## 🎯 Próximos Passos (Após Executar)

1. ✅ **Executar este SQL**
2. ✅ **Verificar tabelas criadas**
3. ⏳ **Migrar dados do localStorage para Supabase**
4. ⏳ **Implementar sistema de famílias**
5. ⏳ **Remover dados mock**

---

**🚀 Execute o SQL agora e me avise se funcionou!**

Arquivo: `create_remaining_tables.sql`
