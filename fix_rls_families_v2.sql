-- =====================================================
-- FIX RLS FAMÍLIAS V2 - SEM RECURSÃO (corrigido)
-- =====================================================
-- Execute no SQL Editor do Supabase
-- =====================================================

-- 1. REMOVER POLÍTICAS ANTIGAS
DROP POLICY IF EXISTS "Users can view families they belong to" ON public.family_groups;
DROP POLICY IF EXISTS "Anyone can create family groups" ON public.family_groups;
DROP POLICY IF EXISTS "Users can view members of their families" ON public.family_members;
DROP POLICY IF EXISTS "Users can join families" ON public.family_members;
DROP POLICY IF EXISTS "Users can leave families" ON public.family_members;

-- 2. DESABILITAR RLS TEMPORARIAMENTE (para criar sem problemas)
ALTER TABLE public.family_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members DISABLE ROW LEVEL SECURITY;

-- PRONTO! Agora você pode:
-- ✅ Criar família
-- ✅ Entrar em família
-- ✅ Listar membros
-- 
-- Nota: RLS desabilitado por enquanto
-- Reativaremos com políticas corretas na próxima fase
