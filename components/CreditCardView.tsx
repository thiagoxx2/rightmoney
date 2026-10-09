import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CreditCard,
  Loader2,
  Calendar,
  Clock,
  LayoutGrid,
  Check,
} from 'lucide-react';
import BillingCycleSelector from './BillingCycleSelector';
import { transactionsService, type Transaction } from '../services/transactions';
import {
  daysUntilDue,
  formatBillingDateLong,
  formatBillingRange,
  getNextBillingCycle,
  getPreviousBillingCycle,
  isCurrentBillingCycle,
  isFutureBillingCycle,
  loadStoredBillingCycle,
  saveStoredBillingCycle,
  type BillingCycle,
} from '../utils/billingCycle';
import {
  computeCategoryTotals,
  formatDayLabel,
  groupTransactionsByDay,
  parseAmount,
} from '../utils/financial';
import { PRIMARY_CREDIT_CARD } from '../constants/creditCard';

interface CreditCardViewProps {
  userIds: string[];
  familyId?: string | null;
  currentUserId?: string;
  /** Incrementar para forçar reload após mutações externas */
  refreshKey?: number;
  renderTransaction: (props: {
    transaction: Transaction;
    index: number;
    onToggleCard?: (transaction: Transaction) => void;
    showCardToggle?: boolean;
  }) => React.ReactNode;
}

const CreditCardView: React.FC<CreditCardViewProps> = ({
  userIds,
  familyId,
  currentUserId,
  refreshKey = 0,
  renderTransaction,
}) => {
  const [cycle, setCycle] = useState<BillingCycle>(() => loadStoredBillingCycle());
  const [rows, setRows] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const canGoNext = !isFutureBillingCycle(getNextBillingCycle(cycle));
  const isCurrent = isCurrentBillingCycle(cycle);

  const load = useCallback(async () => {
    if (userIds.length === 0) {
      setRows([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await transactionsService.getByUserIdsInPeriod({
        userIds,
        range: cycle.range,
        familyId,
      });
      setRows(data.filter((t) => t.type === 'expense'));
    } catch (err) {
      console.error('Error loading credit card cycle:', err);
      setError('Não foi possível carregar a fatura deste ciclo.');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [userIds, cycle.range, familyId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  useEffect(() => {
    saveStoredBillingCycle(cycle);
  }, [cycle]);

  const cardExpenses = useMemo(
    () => rows.filter((t) => t.payment_method === 'credit_card'),
    [rows],
  );

  const untaggedExpenses = useMemo(
    () => rows.filter((t) => t.payment_method !== 'credit_card'),
    [rows],
  );

  const faturaTotal = useMemo(
    () => cardExpenses.reduce((sum, t) => sum + parseAmount(t.amount), 0),
    [cardExpenses],
  );

  const categoryData = useMemo(
    () => computeCategoryTotals(cardExpenses, 'expense'),
    [cardExpenses],
  );

  const byDay = useMemo(
    () => groupTransactionsByDay(cardExpenses),
    [cardExpenses],
  );

  const dueIn = daysUntilDue(cycle.dueDate);
  const dueLabel =
    dueIn > 1
      ? `Vence em ${dueIn} dias`
      : dueIn === 1
        ? 'Vence amanhã'
        : dueIn === 0
          ? 'Vence hoje'
          : `Venceu há ${Math.abs(dueIn)} dias`;

  const goPrevious = () => setCycle((c) => getPreviousBillingCycle(c));
  const goNext = () => {
    const next = getNextBillingCycle(cycle);
    if (!isFutureBillingCycle(next)) setCycle(next);
  };

  const handleToggleCard = async (transaction: Transaction) => {
    if (!currentUserId || transaction.user_id !== currentUserId) return;
    setTogglingId(transaction.id);
    const nextMethod =
      transaction.payment_method === 'credit_card' ? null : 'credit_card';
    try {
      const updated = await transactionsService.update(
        transaction.id,
        currentUserId,
        { payment_method: nextMethod },
      );
      if (!updated) {
        alert('Não foi possível atualizar o meio de pagamento.');
        return;
      }
      setRows((prev) =>
        prev.map((t) =>
          t.id === transaction.id
            ? { ...t, payment_method: nextMethod }
            : t,
        ),
      );
    } catch (err) {
      console.error(err);
      alert('Erro ao marcar no cartão.');
    } finally {
      setTogglingId(null);
    }
  };

  const markAllUntagged = async () => {
    if (!currentUserId || untaggedExpenses.length === 0) return;
    const mine = untaggedExpenses.filter((t) => t.user_id === currentUserId);
    if (mine.length === 0) return;
    if (
      !confirm(
        `Marcar ${mine.length} despesa(s) deste período como cartão ${PRIMARY_CREDIT_CARD.name}?`,
      )
    ) {
      return;
    }
    setIsLoading(true);
    try {
      await Promise.all(
        mine.map((t) =>
          transactionsService.update(t.id, currentUserId, {
            payment_method: 'credit_card',
          }),
        ),
      );
      await load();
    } catch (err) {
      console.error(err);
      alert('Erro ao marcar despesas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <BillingCycleSelector
        cycle={cycle}
        onPrevious={goPrevious}
        onNext={goNext}
        canGoNext={canGoNext}
        isCurrent={isCurrent}
      />

      <div className="glass rounded-[2.5rem] p-6 bg-gradient-to-br from-violet-600/25 to-transparent border-white/10 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-violet-400" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              {PRIMARY_CREDIT_CARD.name} · Fecha dia {PRIMARY_CREDIT_CARD.closingDay}
            </span>
          </div>
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
              dueIn < 0
                ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                : dueIn <= 7
                  ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                  : 'text-violet-300 border-violet-500/30 bg-violet-500/10'
            }`}
          >
            {dueLabel}
          </span>
        </div>

        <div>
          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Total da fatura
          </p>
          <h2 className="text-5xl font-black tracking-tighter">
            R$ {faturaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="theme-inner rounded-2xl p-3 border">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <Calendar size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Fechamento</span>
            </div>
            <p className="text-sm font-black theme-fg">{formatBillingDateLong(cycle.closingDate)}</p>
          </div>
          <div className="theme-inner rounded-2xl p-3 border">
            <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
              <Clock size={12} />
              <span className="text-[8px] font-black uppercase tracking-widest">Vencimento</span>
            </div>
            <p className="text-sm font-black theme-fg">{formatBillingDateLong(cycle.dueDate)}</p>
          </div>
        </div>

        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
          Compras {formatBillingRange(cycle)} · {cardExpenses.length} no cartão
          {untaggedExpenses.length > 0 && ` · ${untaggedExpenses.length} fora`}
        </p>
      </div>

      {categoryData.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-black flex items-center gap-2 tracking-tighter text-zinc-300">
            <LayoutGrid size={16} className="text-violet-400" /> Por categoria
          </h3>
          <div className="space-y-2">
            {categoryData
              .slice()
              .sort((a, b) => b.total - a.total)
              .map((c) => {
                const pct = faturaTotal > 0 ? (c.total / faturaTotal) * 100 : 0;
                return (
                  <div key={c.category} className="glass rounded-2xl p-4 border-white/5 bg-white/[0.03]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold">{c.category}</span>
                      <span className="text-xs font-black">
                        R$ {c.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-violet-500"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={32} className="animate-spin text-violet-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle size={32} className="mx-auto text-rose-500 mb-3" />
          <p className="text-zinc-500 font-bold">{error}</p>
        </div>
      ) : (
        <>
          <section className="space-y-6">
            <h3 className="text-xl font-black tracking-tighter">Lançamentos no cartão</h3>
            {byDay.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center text-zinc-500 text-sm border-white/5">
                Nenhuma despesa marcada como cartão nesta fatura.
                {untaggedExpenses.length > 0 && (
                  <p className="text-xs text-zinc-600 mt-2">
                    Há {untaggedExpenses.length} despesa(s) no período ainda sem cartão — marque abaixo.
                  </p>
                )}
              </div>
            ) : (
              byDay.map((dayGroup) => (
                <div key={dayGroup.date} className="space-y-3">
                  <div className="flex items-end justify-between gap-4 px-1 sticky top-0 z-10 py-2 theme-sticky backdrop-blur-md -mx-1">
                    <div>
                      <h4 className="text-sm font-black theme-fg tracking-tight">
                        {formatDayLabel(dayGroup.date)}
                      </h4>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                        {dayGroup.transactions.length}{' '}
                        {dayGroup.transactions.length === 1 ? 'lançamento' : 'lançamentos'}
                      </p>
                    </div>
                    <p className="text-xs font-black text-rose-400 shrink-0">
                      - {dayGroup.totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {dayGroup.transactions.map((t, i) =>
                      renderTransaction({
                        transaction: t,
                        index: i,
                        showCardToggle: true,
                        onToggleCard: handleToggleCard,
                      }),
                    )}
                  </div>
                </div>
              ))
            )}
          </section>

          {untaggedExpenses.length > 0 && (
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-tighter text-zinc-400">
                  No período · fora do cartão
                </h3>
                {currentUserId && (
                  <button
                    type="button"
                    onClick={() => void markAllUntagged()}
                    className="text-[9px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-1 active:scale-95"
                  >
                    <Check size={12} /> Marcar todas
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-600 font-bold">
                Toque no ícone de cartão para incluir na fatura (ou edite o lançamento).
              </p>
              <div className="space-y-3">
                {untaggedExpenses.map((t, i) =>
                  renderTransaction({
                    transaction: t,
                    index: i,
                    showCardToggle: true,
                    onToggleCard: togglingId === t.id ? undefined : handleToggleCard,
                  }),
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default CreditCardView;
