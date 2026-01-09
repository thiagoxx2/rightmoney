-- =====================================================
-- CORREÇÃO E CRIAÇÃO DAS TABELAS - FINANÇA iOS PWA
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Remove tabelas antigas e cria novamente corretamente
-- =====================================================

-- =====================================================
-- 1. REMOVER TABELAS ANTIGAS (se existirem)
-- =====================================================

-- Remover políticas RLS antigas (se existirem)
DROP POLICY IF EXISTS "Members can view their families" ON public.family_groups;
DROP POLICY IF EXISTS "Members can view family members" ON public.family_members;
DROP POLICY IF EXISTS "Members can view family transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members can insert own transactions" ON public.transactions;

-- Remover tabelas na ordem correta (respeitar foreign keys)
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.family_members CASCADE;
DROP TABLE IF EXISTS public.family_groups CASCADE;

-- =====================================================
-- 2. CRIAR TABELA DE GRUPOS FAMILIARES (PRIMEIRO)
-- =====================================================

CREATE TABLE public.family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por código de convite
CREATE INDEX family_groups_join_code_idx ON public.family_groups(join_code);

-- =====================================================
-- 3. CRIAR TABELA DE MEMBROS DA FAMÍLIA
-- =====================================================

CREATE TABLE public.family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Índices para performance
CREATE INDEX family_members_family_idx ON public.family_members(family_id);
CREATE INDEX family_members_user_idx ON public.family_members(user_id);

-- =====================================================
-- 4. CRIAR TABELA DE TRANSAÇÕES
-- =====================================================

CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX transactions_user_idx ON public.transactions(user_id);
CREATE INDEX transactions_family_idx ON public.transactions(family_id);
CREATE INDEX transactions_date_idx ON public.transactions(date DESC);
CREATE INDEX transactions_type_idx ON public.transactions(type);
CREATE INDEX transactions_category_idx ON public.transactions(category);
CREATE INDEX transactions_user_date_idx ON public.transactions(user_id, date DESC);

-- =====================================================
-- 5. CRIAR TABELA DE ORÇAMENTOS
-- =====================================================

CREATE TABLE public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL CHECK (limit_amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT budgets_unique_constraint UNIQUE NULLS NOT DISTINCT (user_id, family_id, category),
  CONSTRAINT budgets_owner_constraint CHECK (user_id IS NOT NULL OR family_id IS NOT NULL)
);

-- Índices para performance
CREATE INDEX budgets_user_idx ON public.budgets(user_id);
CREATE INDEX budgets_family_idx ON public.budgets(family_id);
CREATE INDEX budgets_category_idx ON public.budgets(category);

-- =====================================================
-- 6. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger para atualizar updated_at em family_groups
DROP TRIGGER IF EXISTS family_groups_updated_at ON public.family_groups;
CREATE TRIGGER family_groups_updated_at
  BEFORE UPDATE ON public.family_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para atualizar updated_at em budgets
DROP TRIGGER IF EXISTS budgets_updated_at ON public.budgets;
CREATE TRIGGER budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA - TRANSACTIONS
-- =====================================================

CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Family members can view family transactions"
  ON public.transactions
  FOR SELECT
  USING (
    family_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = transactions.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON public.transactions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
  ON public.transactions
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- POLÍTICAS DE SEGURANÇA - FAMILY_GROUPS
-- =====================================================

CREATE POLICY "Members can view their families"
  ON public.family_groups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = family_groups.id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create family groups"
  ON public.family_groups
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update family groups"
  ON public.family_groups
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = family_groups.id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'admin'
    )
  );

-- =====================================================
-- POLÍTICAS DE SEGURANÇA - FAMILY_MEMBERS
-- =====================================================

CREATE POLICY "Members can view family members"
  ON public.family_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join families"
  ON public.family_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can remove members"
  ON public.family_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = family_members.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'admin'
    )
  );

-- =====================================================
-- POLÍTICAS DE SEGURANÇA - BUDGETS
-- =====================================================

CREATE POLICY "Users can view own budgets"
  ON public.budgets
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Family members can view family budgets"
  ON public.budgets
  FOR SELECT
  USING (
    family_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = budgets.family_id
      AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own budgets"
  ON public.budgets
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    (family_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = budgets.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'admin'
    ))
  );

CREATE POLICY "Users can update own budgets"
  ON public.budgets
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    (family_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = budgets.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'admin'
    ))
  );

CREATE POLICY "Users can delete own budgets"
  ON public.budgets
  FOR DELETE
  USING (
    user_id = auth.uid() OR
    (family_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = budgets.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'admin'
    ))
  );

-- =====================================================
-- 8. FUNÇÕES ÚTEIS
-- =====================================================

-- Função para gerar código de convite único
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.family_groups WHERE join_code = code) INTO exists_code;
    IF NOT exists_code THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.transactions IS 'Transações financeiras (receitas e despesas) dos usuários';
COMMENT ON TABLE public.family_groups IS 'Grupos familiares para controle financeiro compartilhado';
COMMENT ON TABLE public.family_members IS 'Relacionamento entre usuários e grupos familiares';
COMMENT ON TABLE public.budgets IS 'Orçamentos por categoria (individual ou familiar)';

COMMENT ON COLUMN public.transactions.family_id IS 'NULL = transação individual, NOT NULL = transação familiar';
COMMENT ON COLUMN public.budgets.user_id IS 'NULL se for orçamento familiar, NOT NULL se for individual';
COMMENT ON COLUMN public.budgets.family_id IS 'NULL se for orçamento individual, NOT NULL se for familiar';

-- =====================================================
-- 10. VERIFICAÇÃO FINAL
-- =====================================================

SELECT 
  'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'transactions', COUNT(*) FROM public.transactions
UNION ALL
SELECT 'family_groups', COUNT(*) FROM public.family_groups
UNION ALL
SELECT 'family_members', COUNT(*) FROM public.family_members
UNION ALL
SELECT 'budgets', COUNT(*) FROM public.budgets;
