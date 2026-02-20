-- =====================================================
-- SCHEMA COMPLETO - FINANÇA iOS PWA
-- =====================================================
-- Execute no SQL Editor do Supabase
-- Schema único - sem sistema de migração
-- =====================================================

-- =====================================================
-- 1. PROFILES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de profiles (política de família criada depois)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. FUNÇÕES E TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 3. FAMILY_GROUPS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS family_groups_join_code_idx ON public.family_groups(join_code);

-- =====================================================
-- 4. FAMILY_MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

CREATE INDEX IF NOT EXISTS family_members_family_idx ON public.family_members(family_id);
CREATE INDEX IF NOT EXISTS family_members_user_idx ON public.family_members(user_id);

-- =====================================================
-- 5. TRANSACTIONS
-- =====================================================

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

CREATE INDEX IF NOT EXISTS transactions_user_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_family_idx ON public.transactions(family_id);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions(type);
CREATE INDEX IF NOT EXISTS transactions_category_idx ON public.transactions(category);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON public.transactions(user_id, date DESC);

-- =====================================================
-- 6. BUDGETS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.budgets (
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

CREATE INDEX IF NOT EXISTS budgets_user_idx ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS budgets_family_idx ON public.budgets(family_id);
CREATE INDEX IF NOT EXISTS budgets_category_idx ON public.budgets(category);

-- Triggers updated_at
DROP TRIGGER IF EXISTS family_groups_updated_at ON public.family_groups;
CREATE TRIGGER family_groups_updated_at
  BEFORE UPDATE ON public.family_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS budgets_updated_at ON public.budgets;
CREATE TRIGGER budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Política profiles: membros da família podem ver perfis uns dos outros
DROP POLICY IF EXISTS "Family members can view each other's profiles" ON public.profiles;
CREATE POLICY "Family members can view each other's profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR EXISTS (
      SELECT 1 FROM public.family_members fm1
      INNER JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid() AND fm2.user_id = profiles.id
    )
  );

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Family members can view family transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Members can view their families" ON public.family_groups;
DROP POLICY IF EXISTS "Users can create family groups" ON public.family_groups;
DROP POLICY IF EXISTS "Admins can update family groups" ON public.family_groups;
DROP POLICY IF EXISTS "Members can view family members" ON public.family_members;
DROP POLICY IF EXISTS "Users can join families" ON public.family_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.family_members;
DROP POLICY IF EXISTS "Users can view own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Family members can view family budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON public.budgets;

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Family members can view family transactions" ON public.transactions
  FOR SELECT USING (
    family_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.family_members
      WHERE family_members.family_id = transactions.family_id AND family_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (user_id = auth.uid());

-- Family groups
CREATE POLICY "Members can view their families" ON public.family_groups
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = family_groups.id AND family_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create family groups" ON public.family_groups
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update family groups" ON public.family_groups
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = family_groups.id AND family_members.user_id = auth.uid() AND family_members.role = 'admin'
  ));

-- Family members
CREATE POLICY "Members can view family members" ON public.family_members
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid()
  ));

CREATE POLICY "Users can join families" ON public.family_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can remove members" ON public.family_members
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid() AND fm.role = 'admin'
  ));

-- Budgets
CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Family members can view family budgets" ON public.budgets
  FOR SELECT USING (family_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = budgets.family_id AND family_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT
  WITH CHECK (user_id = auth.uid() OR (family_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = budgets.family_id AND family_members.user_id = auth.uid() AND family_members.role = 'admin'
  )));

CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE
  USING (user_id = auth.uid() OR (family_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = budgets.family_id AND family_members.user_id = auth.uid() AND family_members.role = 'admin'
  )));

CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE
  USING (user_id = auth.uid() OR (family_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = budgets.family_id AND family_members.user_id = auth.uid() AND family_members.role = 'admin'
  )));

-- =====================================================
-- 8. FUNÇÕES ÚTEIS
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT AS $$
DECLARE code TEXT; exists_code BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.family_groups WHERE join_code = code) INTO exists_code;
    IF NOT exists_code THEN RETURN code; END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
