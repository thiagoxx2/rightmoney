-- =====================================================
-- CRIAÇÃO DAS TABELAS RESTANTES - FINANÇA iOS PWA
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- Baseado no schema Prisma fornecido
-- =====================================================

-- =====================================================
-- 1. TABELA DE TRANSAÇÕES (Principal)
-- =====================================================

-- Criar tabela de transações
CREATE TABLE IF NOT EXISTS public.transactions (
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
CREATE INDEX IF NOT EXISTS transactions_user_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_family_idx ON public.transactions(family_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON public.transactions(category);

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON public.transactions(user_id, date DESC);

-- =====================================================
-- 2. TABELA DE GRUPOS FAMILIARES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para busca por código de convite
CREATE INDEX IF NOT EXISTS family_groups_join_code_idx ON public.family_groups(join_code);

-- =====================================================
-- 3. TABELA DE MEMBROS DA FAMÍLIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS family_members_family_idx ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS family_members_user_idx ON public.family_members(user_id);

-- =====================================================
-- 4. TABELA DE ORÇAMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.family_groups(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  limit_amount DECIMAL(10, 2) NOT NULL CHECK (limit_amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Garante um orçamento por categoria por usuário/família
  CONSTRAINT budgets_unique_constraint UNIQUE NULLS NOT DISTINCT (user_id, family_id, category),
  -- Garante que tenha pelo menos user_id ou family_id
  CONSTRAINT budgets_owner_constraint CHECK (user_id IS NOT NULL OR family_id IS NOT NULL)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS budgets_user_idx ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS budgets_family_idx ON public.budgets(family_id);
CREATE INDEX IF NOT EXISTS budgets_category_idx ON public.budgets(category);

-- =====================================================
-- 5. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
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
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS DE SEGURANÇA - TRANSACTIONS
-- =====================================================

-- Usuários podem ver suas próprias transações
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- Membros da família podem ver transações da família
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

-- Usuários podem criar suas próprias transações
CREATE POLICY "Users can insert own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar suas próprias transações
CREATE POLICY "Users can update own transactions"
  ON public.transactions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Usuários podem deletar suas próprias transações
CREATE POLICY "Users can delete own transactions"
  ON public.transactions
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- POLÍTICAS DE SEGURANÇA - FAMILY_GROUPS
-- =====================================================

-- Membros podem ver seus grupos familiares
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

-- Usuários podem criar grupos familiares
CREATE POLICY "Users can create family groups"
  ON public.family_groups
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Admins podem atualizar o grupo
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

-- Membros podem ver outros membros do mesmo grupo
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

-- Usuários podem entrar em grupos (criar relacionamento)
CREATE POLICY "Users can join families"
  ON public.family_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins podem remover membros
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

-- Usuários podem ver seus próprios orçamentos
CREATE POLICY "Users can view own budgets"
  ON public.budgets
  FOR SELECT
  USING (user_id = auth.uid());

-- Membros podem ver orçamentos da família
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

-- Usuários podem criar seus próprios orçamentos
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

-- Usuários podem atualizar seus próprios orçamentos
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

-- Usuários podem deletar seus próprios orçamentos
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
-- 7. FUNÇÕES ÚTEIS
-- =====================================================

-- Função para gerar código de convite único
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Gera código de 8 caracteres
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM public.family_groups WHERE join_code = code) INTO exists_code;
    
    -- Se não existir, retorna o código
    IF NOT exists_code THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para criar grupo familiar automaticamente ao se cadastrar
CREATE OR REPLACE FUNCTION public.create_default_family_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id UUID;
  new_join_code TEXT;
BEGIN
  -- Gera código de convite
  new_join_code := public.generate_join_code();
  
  -- Cria grupo familiar padrão
  INSERT INTO public.family_groups (name, join_code, created_by)
  VALUES (NEW.name || '''s Family', new_join_code, NEW.id)
  RETURNING id INTO new_family_id;
  
  -- Adiciona o usuário como admin do grupo
  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (new_family_id, NEW.id, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar família automaticamente (OPCIONAL - descomente se quiser)
-- DROP TRIGGER IF EXISTS create_family_on_profile_creation ON public.profiles;
-- CREATE TRIGGER create_family_on_profile_creation
--   AFTER INSERT ON public.profiles
--   FOR EACH ROW
--   EXECUTE FUNCTION public.create_default_family_for_new_user();

-- =====================================================
-- 8. COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE public.transactions IS 'Transações financeiras (receitas e despesas) dos usuários';
COMMENT ON TABLE public.family_groups IS 'Grupos familiares para controle financeiro compartilhado';
COMMENT ON TABLE public.family_members IS 'Relacionamento entre usuários e grupos familiares';
COMMENT ON TABLE public.budgets IS 'Orçamentos por categoria (individual ou familiar)';

COMMENT ON COLUMN public.transactions.family_id IS 'NULL = transação individual, NOT NULL = transação familiar';
COMMENT ON COLUMN public.budgets.user_id IS 'NULL se for orçamento familiar, NOT NULL se for individual';
COMMENT ON COLUMN public.budgets.family_id IS 'NULL se for orçamento individual, NOT NULL se for familiar';

-- =====================================================
-- 9. VERIFICAÇÃO FINAL
-- =====================================================

-- Listar todas as tabelas criadas
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'transactions', 'family_groups', 'family_members', 'budgets')
ORDER BY tablename;

-- Contar registros (deve estar vazio exceto profiles)
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
