/** Categorias padrão de receita (espelhadas na documentação do schema Supabase) */
export const INCOME_CATEGORIES = [
  'Salário',
  'Pro-labore',
  'Dividendos',
  'Investimentos',
  'Empresa',
  'Vendas',
  'Pix',
  'Outros',
] as const;

/** Categorias padrão de despesa (espelhadas na documentação do schema Supabase) */
export const EXPENSE_CATEGORIES = [
  'Mercado',
  'Padaria',
  'Lanche',
  'Lazer',
  'Transporte',
  'Combustível',
  'Saúde',
  'Educação',
  'E-commerce',
  'Compras Físicas',
  'Parcelamento',
  'Investimentos',
  'Empresa',
  'Moradia',
  'Assinaturas',
  'Pet',
  'Bem-estar',
  'Pix',
  'Revisar',
  'Juros',
  'Outros',
] as const;

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type Category = IncomeCategory | ExpenseCategory;
