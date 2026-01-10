import { supabase } from './supabase';

// =====================================================
// TIPOS
// =====================================================

export interface Transaction {
  id: string;
  user_id: string;
  family_id?: string | null;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  created_at?: string;
}

// Interface para criar transação (sem campos gerados automaticamente)
export interface CreateTransactionInput {
  description: string;
  amount: number;
  date?: string;
  type: 'income' | 'expense';
  category: string;
  family_id?: string | null;
}

// =====================================================
// SERVIÇO DE TRANSAÇÕES (Supabase)
// =====================================================

export const transactionsService = {
  /**
   * Buscar todas as transações do usuário autenticado
   */
  async getAll(userId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in getAll:', error);
      return [];
    }
  },

  /**
   * Buscar transações de um mês específico
   */
  async getByMonth(userId: string, yearMonth: string): Promise<Transaction[]> {
    try {
      // yearMonth formato: "2025-01"
      const startDate = `${yearMonth}-01`;
      const endDate = new Date(parseInt(yearMonth.split('-')[0]), parseInt(yearMonth.split('-')[1]), 0)
        .toISOString()
        .split('T')[0];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions by month:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in getByMonth:', error);
      return [];
    }
  },

  /**
   * Criar nova transação
   */
  async create(userId: string, input: CreateTransactionInput): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          description: input.description,
          amount: input.amount,
          date: input.date || new Date().toISOString(),
          type: input.type,
          category: input.category,
          family_id: input.family_id || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating transaction:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in create:', error);
      return null;
    }
  },

  /**
   * Atualizar transação existente
   */
  async update(id: string, userId: string, updates: Partial<CreateTransactionInput>): Promise<Transaction | null> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', userId) // Garante que só atualiza próprias transações
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error in update:', error);
      return null;
    }
  },

  /**
   * Deletar transação
   */
  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId); // Garante que só deleta próprias transações

      if (error) {
        console.error('Error deleting transaction:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in delete:', error);
      return false;
    }
  },

  /**
   * Buscar estatísticas do mês (receitas, despesas, saldo)
   */
  async getMonthStats(userId: string, yearMonth: string) {
    try {
      const transactions = await this.getByMonth(userId, yearMonth);

      const stats = transactions.reduce(
        (acc, t) => {
          if (t.type === 'income') {
            acc.income += t.amount;
          } else {
            acc.expense += t.amount;
          }
          return acc;
        },
        { income: 0, expense: 0, balance: 0 }
      );

      stats.balance = stats.income - stats.expense;

      return stats;
    } catch (error) {
      console.error('Error calculating month stats:', error);
      return { income: 0, expense: 0, balance: 0 };
    }
  },

  /**
   * Buscar transações por categoria
   */
  async getByCategory(userId: string, category: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('category', category)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions by category:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in getByCategory:', error);
      return [];
    }
  },

  /**
   * Buscar transações por tipo (income ou expense)
   */
  async getByType(userId: string, type: 'income' | 'expense'): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions by type:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in getByType:', error);
      return [];
    }
  },
};

// =====================================================
// HELPERS
// =====================================================

/**
 * Converter transação do Supabase para formato do app
 * (caso precise de transformações)
 */
export function mapTransactionFromDB(dbTransaction: Transaction): Transaction {
  return {
    ...dbTransaction,
    // Garantir que amount seja number
    amount: typeof dbTransaction.amount === 'string' 
      ? parseFloat(dbTransaction.amount) 
      : dbTransaction.amount,
  };
}

/**
 * Gerar dados mock para desenvolvimento (TEMPORÁRIO)
 * TODO: Remover quando não precisar mais
 */
export function generateMockTransactions(userId: string): Transaction[] {
  const now = new Date();
  const getD = (daysAgo: number) => {
    const d = new Date();
    d.setDate(now.getDate() - daysAgo);
    return d.toISOString();
  };

  return [
    { id: crypto.randomUUID(), user_id: userId, description: 'Salário Sênior', amount: 12500, date: getD(10), category: 'Salário', type: 'income' },
    { id: crypto.randomUUID(), user_id: userId, description: 'Aluguel & Condomínio', amount: 3500, date: getD(8), category: 'Moradia', type: 'expense' },
    { id: crypto.randomUUID(), user_id: userId, description: 'Aporte ETF IVVB11', amount: 2500, date: getD(4), category: 'Investimentos', type: 'expense' },
    { id: crypto.randomUUID(), user_id: userId, description: 'Supermercado Mensal', amount: 1200, date: getD(1), category: 'Mercado', type: 'expense' },
  ];
}
