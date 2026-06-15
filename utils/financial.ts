import type {
  CategoryTotal,
  CumulativeBalance,
  DailyExpense,
  DateRange,
  MonthlyFinancialSummary,
} from '../types/financial';
import type { Transaction } from '../services/transactions';
import type { SelectedPeriod } from '../types/financial';
import { getDaysInPeriod } from './period';

export function toFinancialDate(isoDate: string): string {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isDateInRange(financialDate: string, range: DateRange): boolean {
  return financialDate >= range.start && financialDate < range.endExclusive;
}

export function filterTransactionsByRange(
  transactions: Transaction[],
  range: DateRange,
): Transaction[] {
  return transactions.filter((t) =>
    isDateInRange(toFinancialDate(t.date), range),
  );
}

export function parseAmount(amount: number | string): number {
  return typeof amount === 'string' ? parseFloat(amount) : amount;
}

export function computeCumulativeBalance(
  transactions: Transaction[],
): CumulativeBalance {
  const totals = transactions.reduce(
    (acc, t) => {
      const amount = parseAmount(t.amount);
      if (t.type === 'income') acc.income += amount;
      else acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );
  return {
    income: totals.income,
    expense: totals.expense,
    balance: totals.income - totals.expense,
  };
}

export function computeMonthlySummary(
  transactions: Transaction[],
): MonthlyFinancialSummary {
  const totals = transactions.reduce(
    (acc, t) => {
      const amount = parseAmount(t.amount);
      if (t.type === 'income') acc.income += amount;
      else acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );

  const totalInv = transactions
    .filter((t) => t.category === 'Investimentos')
    .reduce((acc, t) => acc + parseAmount(t.amount), 0);

  return {
    income: totals.income,
    expense: totals.expense,
    balance: totals.income - totals.expense,
    usageRate: totals.income > 0 ? (totals.expense / totals.income) * 100 : 0,
    totalInv,
    savingsRate: totals.income > 0 ? (totalInv / totals.income) * 100 : 0,
  };
}

export function computeCategoryTotals(
  transactions: Transaction[],
  type: 'income' | 'expense',
): CategoryTotal[] {
  const map = new Map<string, number>();
  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + parseAmount(t.amount));
    });
  return Array.from(map.entries()).map(([category, total]) => ({
    category,
    total,
  }));
}

export function computeDailyExpenses(
  transactions: Transaction[],
  period: SelectedPeriod,
): DailyExpense[] {
  const days = getDaysInPeriod(period);
  return days.map((day) => ({
    day,
    amount: transactions
      .filter(
        (t) =>
          t.type === 'expense' && toFinancialDate(t.date) === day,
      )
      .reduce((sum, t) => sum + parseAmount(t.amount), 0),
  }));
}

export function buildGeminiPrompt(
  period: SelectedPeriod,
  summary: MonthlyFinancialSummary,
  categoryData: CategoryTotal[],
  isCurrentMonth: boolean,
): string {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const monthName = monthNames[period.month - 1];
  const periodLabel = isCurrentMonth
    ? `mês atual (${monthName}/${period.year})`
    : `período de ${monthName}/${period.year}`;

  const categoriesText = categoryData.length > 0
    ? categoryData.map((c) => `${c.category}: R$ ${c.total.toFixed(2)}`).join(', ')
    : 'nenhum gasto registrado';

  return [
    `Analise a saúde financeira familiar do ${periodLabel}.`,
    `Mês analisado: ${monthName}.`,
    `Ano analisado: ${period.year}.`,
    `Receitas do período: R$ ${summary.income.toFixed(2)}.`,
    `Despesas do período: R$ ${summary.expense.toFixed(2)}.`,
    `Saldo do período: R$ ${summary.balance.toFixed(2)}.`,
    `Investimentos: R$ ${summary.totalInv.toFixed(2)}.`,
    `Gastos por categoria: ${categoriesText}.`,
    'Responda como um CFO familiar em Português do Brasil, curto e motivador.',
    isCurrentMonth
      ? 'Você pode mencionar que é o mês atual.'
      : 'NÃO descreva este período como "mês atual"; trate-o como um mês passado.',
  ].join(' ');
}
