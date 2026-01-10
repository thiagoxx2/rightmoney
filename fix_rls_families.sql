-- =====================================================
-- REATIVAR RLS PARA FAMÍLIAS (sem recursão)
-- =====================================================
-- Execute no SQL Editor do Supabase
-- =====================================================

-- 1. REATIVAR RLS
ALTER TABLE public.family_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA FAMILY_GROUPS
CREATE POLICY "Users can view families they belong to"
  ON public.family_groups
  FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create family groups"
  ON public.family_groups
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- 3. POLÍTICAS PARA FAMILY_MEMBERS (SEM RECURSÃO!)
CREATE POLICY "Users can view members of their families"
  ON public.family_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    family_id IN (
      SELECT family_id FROM public.family_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join families"
  ON public.family_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave families"
  ON public.family_members
  FOR DELETE
  USING (user_id = auth.uid());

-- PRONTO! Sistema de famílias ativado
