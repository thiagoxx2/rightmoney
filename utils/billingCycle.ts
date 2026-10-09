import type { DateRange } from '../types/financial';
import { PRIMARY_CREDIT_CARD } from '../constants/creditCard';

export interface BillingCycleAnchor {
  /** Ano do fechamento */
  year: number;
  /** Mês do fechamento (1–12) */
  month: number;
}

export interface BillingCycle {
  /** Âncora = mês/ano do fechamento */
  anchor: BillingCycleAnchor;
  /** YYYY-MM-DD do fechamento */
  closingDate: string;
  /** YYYY-MM-DD do vencimento */
  dueDate: string;
  /** Período de compras da fatura */
  range: DateRange;
  /** Ex.: "Fatura Outubro 2026" */
  label: string;
  cardName: string;
  closingDay: number;
  dueDay: number;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

const BILLING_STORAGE_KEY = 'financa_billing_cycle_v1';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toFinancialDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function addMonths(anchor: BillingCycleAnchor, delta: number): BillingCycleAnchor {
  const idx = anchor.year * 12 + (anchor.month - 1) + delta;
  return {
    year: Math.floor(idx / 12),
    month: (idx % 12) + 1,
  };
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/**
 * Ciclo de fatura: compras do dia seguinte ao fechamento anterior
 * até o dia de fechamento (inclusive).
 * Ex.: fecha dia 9 → 10/set inclusive até 09/out inclusive (endExclusive = 10/out).
 */
export function getBillingCycle(
  anchor: BillingCycleAnchor,
  config: { closingDay: number; dueDay: number; name: string } = PRIMARY_CREDIT_CARD,
): BillingCycle {
  const closingDay = clampDay(anchor.year, anchor.month, config.closingDay);
  const dueDay = clampDay(anchor.year, anchor.month, config.dueDay);
  const prev = addMonths(anchor, -1);
  const startDay = clampDay(prev.year, prev.month, config.closingDay) + 1;
  // Se closingDay+1 passar do mês (ex. fecha 31), start = dia 1 do mês do fechamento
  let rangeStart: string;
  if (startDay > daysInMonth(prev.year, prev.month)) {
    rangeStart = toFinancialDate(anchor.year, anchor.month, 1);
  } else {
    rangeStart = toFinancialDate(prev.year, prev.month, startDay);
  }

  const endExclusiveDay = closingDay + 1;
  let endExclusive: string;
  if (endExclusiveDay > daysInMonth(anchor.year, anchor.month)) {
    const next = addMonths(anchor, 1);
    endExclusive = toFinancialDate(next.year, next.month, 1);
  } else {
    endExclusive = toFinancialDate(anchor.year, anchor.month, endExclusiveDay);
  }

  return {
    anchor,
    closingDate: toFinancialDate(anchor.year, anchor.month, closingDay),
    dueDate: toFinancialDate(anchor.year, anchor.month, dueDay),
    range: { start: rangeStart, endExclusive },
    label: `Fatura ${MONTH_NAMES[anchor.month - 1]} ${anchor.year}`,
    cardName: config.name,
    closingDay: config.closingDay,
    dueDay: config.dueDay,
  };
}

/** Ciclo vigente: se já passou do fechamento do mês, aponta para o próximo. */
export function getCurrentBillingCycle(
  now: Date = new Date(),
  config: { closingDay: number; dueDay: number; name: string } = PRIMARY_CREDIT_CARD,
): BillingCycle {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const closingDay = clampDay(year, month, config.closingDay);
  if (day <= closingDay) {
    return getBillingCycle({ year, month }, config);
  }
  return getBillingCycle(addMonths({ year, month }, 1), config);
}

export function getPreviousBillingCycle(cycle: BillingCycle): BillingCycle {
  return getBillingCycle(addMonths(cycle.anchor, -1), {
    closingDay: cycle.closingDay,
    dueDay: cycle.dueDay,
    name: cycle.cardName,
  });
}

export function getNextBillingCycle(cycle: BillingCycle): BillingCycle {
  return getBillingCycle(addMonths(cycle.anchor, 1), {
    closingDay: cycle.closingDay,
    dueDay: cycle.dueDay,
    name: cycle.cardName,
  });
}

export function isFutureBillingCycle(
  cycle: BillingCycle,
  now: Date = new Date(),
): boolean {
  const current = getCurrentBillingCycle(now);
  if (cycle.anchor.year > current.anchor.year) return true;
  if (
    cycle.anchor.year === current.anchor.year &&
    cycle.anchor.month > current.anchor.month
  ) {
    return true;
  }
  return false;
}

export function isCurrentBillingCycle(
  cycle: BillingCycle,
  now: Date = new Date(),
): boolean {
  const current = getCurrentBillingCycle(now);
  return (
    cycle.anchor.year === current.anchor.year &&
    cycle.anchor.month === current.anchor.month
  );
}

export function formatBillingDate(financialDate: string): string {
  const [, m, d] = financialDate.split('-');
  return `${d}/${m}`;
}

export function formatBillingDateLong(financialDate: string): string {
  const [y, m, d] = financialDate.split('-');
  return `${d}/${m}/${y}`;
}

/** Dias até o vencimento (negativo = atrasado). */
export function daysUntilDue(dueDate: string, now: Date = new Date()): number {
  const [y, m, d] = dueDate.split('-').map(Number);
  const due = new Date(y, m - 1, d, 23, 59, 59, 999);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function loadStoredBillingCycle(): BillingCycle {
  try {
    const raw = localStorage.getItem(BILLING_STORAGE_KEY);
    if (!raw) return getCurrentBillingCycle();
    const parsed = JSON.parse(raw) as BillingCycleAnchor;
    if (
      typeof parsed.year === 'number' &&
      typeof parsed.month === 'number' &&
      parsed.month >= 1 &&
      parsed.month <= 12
    ) {
      const cycle = getBillingCycle(parsed);
      if (!isFutureBillingCycle(cycle)) return cycle;
    }
  } catch {
    // ignore
  }
  return getCurrentBillingCycle();
}

export function saveStoredBillingCycle(cycle: BillingCycle): void {
  localStorage.setItem(
    BILLING_STORAGE_KEY,
    JSON.stringify(cycle.anchor),
  );
}

/** Faixa legível: "10/09 → 09/10" */
export function formatBillingRange(cycle: BillingCycle): string {
  const endInclusive = (() => {
    const [y, m, d] = cycle.range.endExclusive.split('-').map(Number);
    const end = new Date(y, m - 1, d);
    end.setDate(end.getDate() - 1);
    return toFinancialDate(end.getFullYear(), end.getMonth() + 1, end.getDate());
  })();
  return `${formatBillingDate(cycle.range.start)} → ${formatBillingDate(endInclusive)}`;
}
