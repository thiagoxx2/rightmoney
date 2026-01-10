-- =====================================================
-- FIX RLS - SIMPLIFICADO (Solução A)
-- =====================================================
-- Remove políticas recursivas e simplifica para uso individual
-- Execute no SQL Editor do Supabase
-- =====================================================

-- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS
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

-- 2. POLÍTICAS SIMPLES PARA TRANSACTIONS (INDIVIDUAL)
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  USING (user_id = auth.uid());

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

-- 3. DESABILITAR RLS EM TABELAS NÃO USADAS (por enquanto)
ALTER TABLE public.family_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;

-- PRONTO! Agora você pode:
-- ✅ Carregar transações
-- ✅ Criar transações
-- ✅ Deletar transações
-- ✅ Sem recursão
