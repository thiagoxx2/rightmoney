-- Documenta categorias padrão de despesa (campo continua TEXT livre para categorias customizadas)
COMMENT ON COLUMN public.transactions.category IS
  'Categoria do lançamento. Despesas padrão: Mercado, Padaria, Lanche, Lazer, Transporte, Saúde, Educação, E-commerce, Compras Físicas, Investimentos, Empresa, Moradia, Assinaturas, Pet, Bem-estar, Outros. Receitas padrão: Salário, Pro-labore, Dividendos, Investimentos, Empresa, Vendas, Outros.';

COMMENT ON COLUMN public.budgets.category IS
  'Categoria do orçamento. Mesmas categorias padrão de despesa da tabela transactions.';
