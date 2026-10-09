/** Configuração do cartão de crédito principal (Nubank). */
export const PRIMARY_CREDIT_CARD = {
  id: 'nubank',
  name: 'Nubank',
  /** Dia de fechamento da fatura (inclusive). */
  closingDay: 9,
  /** Dia de vencimento da fatura. */
  dueDay: 16,
} as const;

export type PaymentMethod =
  | 'credit_card'
  | 'debit'
  | 'pix'
  | 'cash'
  | 'transfer';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  credit_card: 'Cartão de crédito',
  debit: 'Débito',
  pix: 'Pix',
  cash: 'Dinheiro',
  transfer: 'Transferência',
};
