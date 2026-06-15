-- Migration segura e reversível: RLS para visualização familiar + índice composto
-- Reversão:
--   DROP INDEX IF EXISTS public.transactions_family_date_idx;
--   DROP POLICY IF EXISTS "Family members can view co-member transactions" ON public.transactions;

-- Permite que membros da mesma família vejam transações uns dos outros
-- (complementa a política existente de transações próprias)
DROP POLICY IF EXISTS "Family members can view co-member transactions" ON public.transactions;
CREATE POLICY "Family members can view co-member transactions"
  ON public.transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.family_members fm_viewer
      INNER JOIN public.family_members fm_owner
        ON fm_viewer.family_id = fm_owner.family_id
      WHERE fm_viewer.user_id = auth.uid()
        AND fm_owner.user_id = transactions.user_id
    )
  );

-- Índice para consultas por família e data
CREATE INDEX IF NOT EXISTS transactions_family_date_idx
  ON public.transactions (family_id, date DESC);
