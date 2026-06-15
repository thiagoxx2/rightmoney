import type { DateRange, SelectedPeriod } from '../types/financial';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

const PERIOD_STORAGE_KEY = 'financa_selected_period_v1';

export function getCurrentPeriod(): SelectedPeriod {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function periodToYearMonth(period: SelectedPeriod): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`;
}

export function periodToLabel(period: SelectedPeriod): string {
  return `${MONTH_NAMES[period.month - 1]} ${period.year}`;
}

export function getDateRangeForPeriod(period: SelectedPeriod): DateRange {
  const start = `${period.year}-${String(period.month).padStart(2, '0')}-01`;
  const nextMonth = period.month === 12
    ? { year: period.year + 1, month: 1 }
    : { year: period.year, month: period.month + 1 };
  const endExclusive = `${nextMonth.year}-${String(nextMonth.month).padStart(2, '0')}-01`;
  return { start, endExclusive };
}

export function getLocalBoundaryIsoStrings(period: SelectedPeriod): {
  startIso: string;
  endExclusiveIso: string;
} {
  const start = new Date(period.year, period.month - 1, 1, 0, 0, 0, 0);
  const endExclusive = new Date(period.year, period.month, 1, 0, 0, 0, 0);
  return {
    startIso: start.toISOString(),
    endExclusiveIso: endExclusive.toISOString(),
  };
}

export function getPreviousPeriod(period: SelectedPeriod): SelectedPeriod {
  if (period.month === 1) {
    return { year: period.year - 1, month: 12 };
  }
  return { year: period.year, month: period.month - 1 };
}

export function getNextPeriod(period: SelectedPeriod): SelectedPeriod {
  if (period.month === 12) {
    return { year: period.year + 1, month: 1 };
  }
  return { year: period.year, month: period.month + 1 };
}

export function isFuturePeriod(period: SelectedPeriod): boolean {
  const current = getCurrentPeriod();
  if (period.year > current.year) return true;
  if (period.year === current.year && period.month > current.month) return true;
  return false;
}

export function isCurrentPeriod(period: SelectedPeriod): boolean {
  const current = getCurrentPeriod();
  return period.year === current.year && period.month === current.month;
}

export function loadStoredPeriod(): SelectedPeriod {
  try {
    const raw = localStorage.getItem(PERIOD_STORAGE_KEY);
    if (!raw) return getCurrentPeriod();
    const parsed = JSON.parse(raw) as SelectedPeriod;
    if (
      typeof parsed.year === 'number' &&
      typeof parsed.month === 'number' &&
      parsed.month >= 1 &&
      parsed.month <= 12 &&
      !isFuturePeriod(parsed)
    ) {
      return parsed;
    }
  } catch {
    // ignore invalid storage
  }
  return getCurrentPeriod();
}

export function saveStoredPeriod(period: SelectedPeriod): void {
  localStorage.setItem(PERIOD_STORAGE_KEY, JSON.stringify(period));
}

export function financialDateToIsoNoon(financialDate: string): string {
  return `${financialDate}T12:00:00.000Z`;
}

export function getDaysInPeriod(period: SelectedPeriod): string[] {
  const range = getDateRangeForPeriod(period);
  const days: string[] = [];
  const [startYear, startMonth, startDay] = range.start.split('-').map(Number);
  const cursor = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(range.endExclusive);

  while (cursor < end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}
