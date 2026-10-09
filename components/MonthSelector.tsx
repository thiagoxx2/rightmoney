import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { usePeriod } from '../contexts/PeriodContext';

const MonthSelector: React.FC = () => {
  const {
    periodLabel,
    goToPreviousMonth,
    goToNextMonth,
    canGoNext,
    isCurrentMonth,
  } = usePeriod();

  return (
    <div className="glass rounded-[2rem] p-4 flex items-center justify-between border-white/10">
      <button
        type="button"
        onClick={goToPreviousMonth}
        aria-label="Mês anterior"
        className="p-3 rounded-2xl theme-chip border theme-fg active:scale-95 transition-transform"
      >
        <ChevronLeft size={20} strokeWidth={3} />
      </button>

      <div className="flex flex-col items-center gap-1 min-w-0 px-2">
        <div className="flex items-center gap-2 text-blue-400">
          <Calendar size={14} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {isCurrentMonth ? 'Mês Atual' : 'Período'}
          </span>
        </div>
        <p className="text-sm font-black tracking-tight truncate theme-fg">{periodLabel}</p>
      </div>

      <button
        type="button"
        onClick={goToNextMonth}
        disabled={!canGoNext}
        aria-label="Próximo mês"
        className={`p-3 rounded-2xl border active:scale-95 transition-transform ${
          canGoNext
            ? 'theme-chip theme-fg'
            : 'theme-chip text-zinc-700 nav-tab-inactive cursor-not-allowed opacity-50'
        }`}
      >
        <ChevronRight size={20} strokeWidth={3} />
      </button>
    </div>
  );
};

export default MonthSelector;
