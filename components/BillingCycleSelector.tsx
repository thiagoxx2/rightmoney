import React from 'react';
import { ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import type { BillingCycle } from '../utils/billingCycle';
import { formatBillingRange } from '../utils/billingCycle';

interface BillingCycleSelectorProps {
  cycle: BillingCycle;
  onPrevious: () => void;
  onNext: () => void;
  canGoNext: boolean;
  isCurrent: boolean;
}

const BillingCycleSelector: React.FC<BillingCycleSelectorProps> = ({
  cycle,
  onPrevious,
  onNext,
  canGoNext,
  isCurrent,
}) => {
  return (
    <div className="glass rounded-[2rem] p-4 flex items-center justify-between border-white/10">
      <button
        type="button"
        onClick={onPrevious}
        aria-label="Fatura anterior"
        className="p-3 rounded-2xl theme-chip border theme-fg active:scale-95 transition-transform"
      >
        <ChevronLeft size={20} strokeWidth={3} />
      </button>

      <div className="flex flex-col items-center gap-1 min-w-0 px-2">
        <div className="flex items-center gap-2 text-violet-400">
          <CreditCard size={14} />
          <span className="text-[9px] font-black uppercase tracking-widest">
            {isCurrent ? 'Fatura Atual' : 'Fatura'}
          </span>
        </div>
        <p className="text-sm font-black tracking-tight truncate theme-fg">{cycle.label}</p>
        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
          {formatBillingRange(cycle)} · Vence {cycle.dueDate.split('-').reverse().join('/')}
        </p>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Próxima fatura"
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

export default BillingCycleSelector;
