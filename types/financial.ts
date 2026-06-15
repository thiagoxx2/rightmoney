export interface SelectedPeriod {
  year: number;
  month: number;
}

export interface DateRange {
  /** YYYY-MM-DD inclusive */
  start: string;
  /** YYYY-MM-DD exclusive */
  endExclusive: string;
}

export interface MonthlyFinancialSummary {
  income: number;
  expense: number;
  balance: number;
  usageRate: number;
  totalInv: number;
  savingsRate: number;
}

/** Saldo consolidado de todo o histórico (carteira) */
export interface CumulativeBalance {
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface DailyExpense {
  day: string;
  amount: number;
}

export interface MonthlyTransactionGroup<T = unknown> {
  period: SelectedPeriod;
  transactions: T[];
  summary: MonthlyFinancialSummary;
}
