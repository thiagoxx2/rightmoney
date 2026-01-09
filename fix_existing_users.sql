-- =====================================================
-- SCRIPT PARA CRIAR PERFIS DE USUÁRIOS EXISTENTES
-- =====================================================
-- Execute este script se você já tem usuários no auth.users
-- mas não tem perfis na tabela profiles
-- =====================================================

-- Criar perfis para todos os usuários que não têm perfil ainda
INSERT INTO public.profiles (id, email, name, avatar_url, role)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'name',
    SPLIT_PART(u.email, '@', 1)
  ) as name,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || u.id as avatar_url,
  'admin' as role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verificar quantos perfis foram criados
SELECT COUNT(*) as perfis_criados
FROM public.profiles;
