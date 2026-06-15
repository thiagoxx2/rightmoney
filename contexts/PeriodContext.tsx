import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { DateRange, SelectedPeriod } from '../types/financial';
import {
  getCurrentPeriod,
  getDateRangeForPeriod,
  getNextPeriod,
  getPreviousPeriod,
  isCurrentPeriod,
  isFuturePeriod,
  loadStoredPeriod,
  periodToLabel,
  periodToYearMonth,
  saveStoredPeriod,
} from '../utils/period';

interface PeriodContextType {
  selectedPeriod: SelectedPeriod;
  dateRange: DateRange;
  yearMonth: string;
  periodLabel: string;
  isCurrentMonth: boolean;
  canGoNext: boolean;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  setPeriod: (period: SelectedPeriod) => void;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const usePeriod = (): PeriodContextType => {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
};

export const PeriodProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<SelectedPeriod>(
    loadStoredPeriod,
  );

  const updatePeriod = useCallback((period: SelectedPeriod) => {
    if (isFuturePeriod(period)) return;
    setSelectedPeriod(period);
    saveStoredPeriod(period);
  }, []);

  const goToPreviousMonth = useCallback(() => {
    updatePeriod(getPreviousPeriod(selectedPeriod));
  }, [selectedPeriod, updatePeriod]);

  const goToNextMonth = useCallback(() => {
    const next = getNextPeriod(selectedPeriod);
    if (!isFuturePeriod(next)) {
      updatePeriod(next);
    }
  }, [selectedPeriod, updatePeriod]);

  const value = useMemo<PeriodContextType>(() => {
    const dateRange = getDateRangeForPeriod(selectedPeriod);
    const next = getNextPeriod(selectedPeriod);
    return {
      selectedPeriod,
      dateRange,
      yearMonth: periodToYearMonth(selectedPeriod),
      periodLabel: periodToLabel(selectedPeriod),
      isCurrentMonth: isCurrentPeriod(selectedPeriod),
      canGoNext: !isFuturePeriod(next),
      goToPreviousMonth,
      goToNextMonth,
      setPeriod: updatePeriod,
    };
  }, [selectedPeriod, goToPreviousMonth, goToNextMonth, updatePeriod]);

  return (
    <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
  );
};
