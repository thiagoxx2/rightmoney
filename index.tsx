
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Plus, Wallet, ArrowUpRight, ArrowDownLeft, Activity, 
  TrendingUp, History, Trash2, Search, Check, AlertCircle, Sparkles, Pencil,
  Target, BarChart3, PieChart as PieIcon, Calendar, BrainCircuit,
  Loader2, ChevronRight, MessageSquare, LayoutGrid, Gauge, Users,
  User as UserIcon, Share2, ShieldCheck, LogOut, TrendingDown
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, AreaChart, Area, XAxis, YAxis
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PeriodProvider, usePeriod } from './contexts/PeriodContext';
import AuthScreen from './components/AuthScreen';
import MonthSelector from './components/MonthSelector';
import { transactionsService, type Transaction } from './services/transactions';
import { familiesService, FamilyWithMembers } from './services/families';
import FamilyModal from './components/FamilyModal';
import {
  buildGeminiPrompt,
  computeCategoryTotals,
  computeCumulativeBalance,
  computeDailyExpenses,
  computeMonthlySummary,
  parseAmount,
  toFinancialDate,
} from './utils/financial';
import type { CumulativeBalance } from './types/financial';
import { financialDateToIsoNoon } from './utils/period';
import type { CategoryTotal, DailyExpense } from './types/financial';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Category,
  type ExpenseCategory,
  type IncomeCategory,
} from './constants/categories';

// --- 1. CONFIGURAÇÕES E TIPOS (SUPABASE READY) ---

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'member';
}

interface FamilyGroup {
  id: string;
  name: string;
  joinCode: string;
  members: AppUser[];
}

interface Budget {
  category: ExpenseCategory;
  limit: number;
}

const COLORS = ['#3B82F6', '#60A5FA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

// --- 2. DADOS MOCKADOS (TEMPORÁRIOS - serão removidos com Supabase) ---
const FAMILY_MOCK: FamilyGroup = {
  id: 'fam-999',
  name: 'Residência Silva',
  joinCode: 'SILVA-2025-XP',
  members: [
    { id: 'u-2', name: 'Mariana', email: 'mari@familia.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mari', role: 'member' },
    { id: 'u-3', name: 'Lucas', email: 'lucas@familia.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas', role: 'member' }
  ]
};

// --- FUNÇÃO PARA GERAR DADOS MOCK (REMOVIDA - agora usa Supabase) ---
// Dados mock foram migrados para o Supabase
// Use o banco de dados para criar transações reais

const INITIAL_BUDGETS: Budget[] = [
  { category: 'Mercado', limit: 2000 },
  { category: 'Lanche', limit: 500 },
  { category: 'Investimentos', limit: 3000 },
  { category: 'Transporte', limit: 400 }
];

// --- 3. PERSISTÊNCIA ---
// TRANSAÇÕES: Migrado para Supabase (usa transactionsService)
// BUDGETS: Ainda usa localStorage (será migrado na próxima fase)

const BUDGET_KEY = 'financa_budgets_v3';

const budgetStorageService = {
  getBudgets: (): Budget[] => {
    const data = localStorage.getItem(BUDGET_KEY);
    if (!data) {
      localStorage.setItem(BUDGET_KEY, JSON.stringify(INITIAL_BUDGETS));
      return INITIAL_BUDGETS;
    }
    return JSON.parse(data);
  },
  saveBudget: (b: Budget) => {
    const all = budgetStorageService.getBudgets().filter(x => x.category !== b.category);
    localStorage.setItem(BUDGET_KEY, JSON.stringify([...all, b]));
  },
  removeBudget: (category: string) => {
    const filtered = budgetStorageService.getBudgets().filter(b => b.category !== category);
    localStorage.setItem(BUDGET_KEY, JSON.stringify(filtered));
  }
};

// --- 4. COMPONENTES VISUAIS ---

const MetricCard: React.FC<{ title: string, value: string, subValue: string, icon: React.ReactNode, color: string }> = ({ title, value, subValue, icon, color }) => (
  <div className="glass rounded-[2rem] p-5 flex flex-col justify-between min-w-[160px] border-white/5 bg-white/5">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-xl bg-white/5`} style={{ color }}>{icon}</div>
      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{title}</span>
    </div>
    <div>
      <h4 className="text-2xl font-black tracking-tighter mb-0.5">{value}</h4>
      <p className="text-[9px] font-bold text-zinc-500 uppercase">{subValue}</p>
    </div>
  </div>
);

const TransactionItem: React.FC<{ 
  transaction: Transaction; 
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  currentUserId?: string;
  index: number;
  familyMembers: AppUser[];
}> = ({ transaction, onDelete, onEdit, currentUserId, index, familyMembers }) => {
  const member = familyMembers.find(m => m.id === transaction.user_id);
  const canModify = currentUserId === transaction.user_id;

  return (
    <div className="glass p-5 rounded-[2rem] flex items-center justify-between list-item-enter bg-black/40 border border-white/5 active:scale-[0.98] transition-all" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${transaction.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
          {transaction.type === 'income' ? <ArrowUpRight size={20} strokeWidth={3} /> : <ArrowDownLeft size={20} strokeWidth={3} />}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-sm truncate pr-2">{transaction.description}</h4>
          <div className="flex items-center gap-2">
            <img src={member?.avatar} className="w-3.5 h-3.5 rounded-full border border-white/10" alt="" />
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-tighter truncate">
              {member?.name || 'Membro'} • {transaction.category}
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <p className={`font-black text-sm ${transaction.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
          {transaction.type === 'income' ? '+' : '-'} {parseAmount(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        {canModify && (
          <>
            <button onClick={() => onEdit(transaction)} className="p-2 text-zinc-800 hover:text-blue-400 transition-colors" aria-label="Editar lançamento">
              <Pencil size={16} />
            </button>
            <button onClick={() => onDelete(transaction.id)} className="p-2 text-zinc-800 hover:text-rose-500 transition-colors" aria-label="Excluir lançamento">
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const BudgetProgressCard: React.FC<{ budget: Budget; spent: number; onDelete: (cat: string) => void }> = ({ budget, spent, onDelete }) => {
  const percent = Math.min((spent / budget.limit) * 100, 100);
  const isOver = spent > budget.limit;
  const colorClass = isOver ? 'bg-rose-500' : percent > 85 ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="glass p-6 rounded-[2.5rem] bg-white/5 border-white/5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isOver ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
            <Target size={18} />
          </div>
          <div>
            <h4 className="font-bold text-sm">{budget.category}</h4>
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Limite Familiar: R$ {budget.limit.toLocaleString()}</p>
          </div>
        </div>
        <button onClick={() => onDelete(budget.category)} className="p-2 text-zinc-800 hover:text-rose-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-xl font-black tracking-tighter">R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <span className={`text-[10px] font-black uppercase ${isOver ? 'text-rose-500' : 'text-zinc-500'}`}>{percent.toFixed(0)}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full ${colorClass} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
};

// --- GRÁFICOS ---

const TrendChart: React.FC<{ data: DailyExpense[] }> = ({ data }) => (
  <div className="h-56 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="day" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#52525b', fontSize: 10, fontWeight: 800 }} 
          tickFormatter={(val) => val.split('-')[2]} 
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 9, fontWeight: 800 }} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px', backdropFilter: 'blur(10px)' }}
          itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}
          labelStyle={{ color: '#3B82F6', fontWeight: 800, fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}
          labelFormatter={(label) => {
            const parts = label.split('-');
            return `📅 ${parts[2]}/${parts[1]}/${parts[0]}`;
          }}
          formatter={(value: number) => [
            value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            'Total Gasto'
          ]}
        />
        <Area type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorTrend)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const DonutChart: React.FC<{ data: CategoryTotal[] }> = ({ data }) => {
  const totalSpending = useMemo(() => data.reduce((acc, curr) => acc + curr.total, 0), [data]);

  return (
    <div className="space-y-6">
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={4} dataKey="total" nameKey="category" stroke="none" cornerRadius={8}>
              {data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mix de Gastos</span>
          <span className="text-xl font-black">Global</span>
        </div>
      </div>
      
      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-2">
        {data.map((item, index) => {
          const percent = totalSpending > 0 ? (item.total / totalSpending) * 100 : 0;
          return (
            <div key={item.category} className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white truncate leading-tight">{item.category}</p>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">{percent.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- MODAIS ---

const BudgetModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (b: Budget) => void }> = ({ isOpen, onClose, onSave }) => {
  const [cat, setCat] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [rawAmount, setRawAmount] = useState('0');
  const formattedValue = useMemo(() => (parseInt(rawAmount) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), [rawAmount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full glass rounded-t-[3rem] p-8 pb-12 animate-slide-up safe-pb">
        <h2 className="text-2xl font-black mb-6 tracking-tighter">Novo Orçamento</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto no-scrollbar">
            {EXPENSE_CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`py-3 px-1 rounded-xl text-[9px] font-black uppercase border transition-all ${cat === c ? 'bg-blue-600/20 border-blue-500/40 text-blue-400' : 'border-white/5 text-zinc-600'}`}>{c}</button>
            ))}
          </div>
          <div className="relative">
            <input type="tel" value={formattedValue} onChange={e => setRawAmount(e.target.value.replace(/\D/g, '') || '0')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-4xl font-black outline-none focus:border-blue-500 text-center" />
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-zinc-500 uppercase">Limite Mensal</span>
          </div>
          <button onClick={() => { onSave({ category: cat, limit: parseInt(rawAmount)/100 }); onClose(); setRawAmount('0'); }} className="w-full py-5 bg-blue-600 rounded-[2rem] font-black text-lg text-white shadow-xl shadow-blue-500/20">Definir Orçamento</button>
        </div>
      </div>
    </div>
  );
};

type TransactionFormData = {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
};

const getCategoryOptions = (
  type: 'income' | 'expense',
  currentCategory?: string,
): string[] => {
  const base = type === 'income' ? [...INCOME_CATEGORIES] : [...EXPENSE_CATEGORIES];
  if (currentCategory && !base.some((c) => c === currentCategory)) {
    return [currentCategory, ...base];
  }
  return base;
};

const TransactionModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (t: TransactionFormData) => void;
  transaction?: Transaction | null;
}> = ({ isOpen, onClose, onSave, transaction }) => {
  const isEditing = !!transaction;
  const [desc, setDesc] = useState('');
  const [rawAmount, setRawAmount] = useState('0'); 
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [cat, setCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [financialDate, setFinancialDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const formattedValue = useMemo(() => (parseInt(rawAmount) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), [rawAmount]);
  const categoryOptions = useMemo(
    () => getCategoryOptions(type, cat),
    [type, cat],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (transaction) {
      setDesc(transaction.description);
      setRawAmount(String(Math.round(parseAmount(transaction.amount) * 100)));
      setType(transaction.type);
      setCat(transaction.category);
      setFinancialDate(toFinancialDate(transaction.date));
      return;
    }
    const now = new Date();
    setDesc('');
    setRawAmount('0');
    setType('expense');
    setCat(EXPENSE_CATEGORIES[0]);
    setFinancialDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  }, [isOpen, transaction]);

  useEffect(() => {
    const options = getCategoryOptions(type, cat);
    if (!options.includes(cat)) {
      setCat(options[0]);
    }
  }, [type, cat]);

  if (!isOpen) return null;

  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full glass rounded-t-[3rem] p-8 pb-12 animate-slide-up safe-pb max-h-[92vh] flex flex-col">
        <h2 className="text-2xl font-black mb-6 tracking-tighter">
          {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
        </h2>
        <form onSubmit={e => { 
          e.preventDefault(); 
          onSave({ 
            description: desc || 'Sem descrição', 
            amount: parseInt(rawAmount) / 100, 
            category: cat, 
            type, 
            date: financialDateToIsoNoon(financialDate),
          }); 
          onClose(); 
        }} className="space-y-6 overflow-y-auto no-scrollbar">
          <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5">
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${type === 'expense' ? 'bg-rose-500 text-white' : 'text-zinc-500'}`}>Despesa</button>
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${type === 'income' ? 'bg-emerald-500 text-white' : 'text-zinc-500'}`}>Receita</button>
          </div>
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="O que você comprou?" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none" required />
          <div className="relative">
            <input type="tel" value={formattedValue} onChange={e => setRawAmount(e.target.value.replace(/\D/g, '') || '0')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-4xl font-black text-center outline-none" required />
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-zinc-500 uppercase">Valor</span>
          </div>
          <div>
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Data do lançamento</label>
            <input
              type="date"
              value={financialDate}
              max={todayStr}
              onChange={e => setFinancialDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-blue-500"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto no-scrollbar">
            {categoryOptions.map(c => (
              <button key={c} type="button" onClick={() => setCat(c)} className={`py-3 px-1 rounded-xl text-[9px] font-black uppercase border transition-all truncate ${cat === c ? 'bg-white/20 border-white/30 text-white' : 'border-white/5 text-zinc-600'}`}>{c}</button>
            ))}
          </div>
          <button type="submit" className={`w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-2 ${type === 'income' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            {isEditing ? 'Salvar Alterações' : `Confirmar ${type === 'income' ? 'Receita' : 'Gasto'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

const App: React.FC = () => {
  const { appUser, signOut } = useAuth();
  const {
    selectedPeriod,
    dateRange,
    periodLabel,
    isCurrentMonth,
  } = usePeriod();
  const [activeTab, setActiveTab] = useState<'resumo' | 'histórico' | 'orçamentos' | 'família'>('resumo');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [families, setFamilies] = useState<FamilyWithMembers[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<CumulativeBalance | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const primaryFamilyId = families[0]?.id ?? null;

  const familyMemberIds = useMemo(() => {
    const ids = new Set<string>();
    if (appUser) ids.add(appUser.id);
    families.forEach(family => {
      family.members.forEach(member => ids.add(member.id));
    });
    return Array.from(ids);
  }, [appUser, families]);

  const loadTransactions = async () => {
    if (!appUser) return;

    setIsLoadingTransactions(true);
    setTransactionsError(null);
    try {
      const data = await transactionsService.getByUserIdsInPeriod({
        userIds: familyMemberIds,
        range: dateRange,
        familyId: primaryFamilyId,
      });
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactionsError('Não foi possível carregar as transações deste período.');
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const loadWalletBalance = async () => {
    if (!appUser || familyMemberIds.length === 0) return;

    setIsLoadingWallet(true);
    setWalletError(null);
    try {
      const allTransactions = await transactionsService.getByUserIds(familyMemberIds);
      setWalletBalance(computeCumulativeBalance(allTransactions));
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setWalletError('Não foi possível calcular o saldo em carteira.');
      setWalletBalance(null);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  // Carregar famílias do Supabase
  const loadFamilies = async () => {
    if (!appUser) return;
    
    try {
      const data = await familiesService.getMyFamilies(appUser.id);
      setFamilies(data);
    } catch (error) {
      console.error('Error loading families:', error);
    }
  };

  useEffect(() => { 
    if (appUser) {
      loadFamilies();
      setBudgets(budgetStorageService.getBudgets()); 
    }
  }, [appUser]);

  useEffect(() => {
    if (appUser) {
      loadTransactions();
    }
  }, [appUser, families, dateRange, familyMemberIds, primaryFamilyId]);

  useEffect(() => {
    if (appUser) {
      loadWalletBalance();
    }
  }, [appUser, familyMemberIds]);

  useEffect(() => {
    setAiAnalysis(null);
    setAiError(null);
  }, [selectedPeriod]);

  const periodTransactions = transactions;

  const stats = useMemo(
    () => computeMonthlySummary(periodTransactions),
    [periodTransactions],
  );

  const categoryData = useMemo(
    () => computeCategoryTotals(periodTransactions, 'expense'),
    [periodTransactions],
  );

  const trendData = useMemo(
    () => computeDailyExpenses(periodTransactions, selectedPeriod),
    [periodTransactions, selectedPeriod],
  );

  const handleAiAnalysis = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setAiError('Configure a API Key do Gemini nas variáveis de ambiente.');
        setIsAiLoading(false);
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const prompt = buildGeminiPrompt(
        selectedPeriod,
        stats,
        categoryData,
        isCurrentMonth,
      );
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiAnalysis(response.text || 'Análise indisponível.');
    } catch {
      setAiError('Erro ao gerar análise. Tente novamente.');
      setAiAnalysis(null);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Deseja sair da sua conta?')) {
      await signOut();
    }
  };

  const closeTransactionModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const openCreateModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleSaveTransaction = async (transactionData: TransactionFormData) => {
    if (editingTransaction) {
      await handleUpdateTransaction(editingTransaction.id, transactionData);
    } else {
      await handleCreateTransaction(transactionData);
    }
  };

  const handleCreateTransaction = async (transactionData: TransactionFormData) => {
    if (!appUser) return;
    
    try {
      await transactionsService.create(appUser.id, {
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category,
        date: transactionData.date,
      }, primaryFamilyId);
      
      await Promise.all([loadTransactions(), loadWalletBalance()]);
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Erro ao criar transação. Tente novamente.');
    }
  };

  const handleUpdateTransaction = async (transactionId: string, transactionData: TransactionFormData) => {
    if (!appUser) return;

    try {
      const updated = await transactionsService.update(transactionId, appUser.id, {
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        category: transactionData.category,
        date: transactionData.date,
      });

      if (!updated) {
        alert('Erro ao atualizar transação. Tente novamente.');
        return;
      }

      closeTransactionModal();
      await Promise.all([loadTransactions(), loadWalletBalance()]);
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Erro ao atualizar transação. Tente novamente.');
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!appUser) return;
    
    if (!confirm('Remover este lançamento?')) return;
    
    try {
      await transactionsService.delete(transactionId, appUser.id);
      
      await Promise.all([loadTransactions(), loadWalletBalance()]);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Erro ao deletar transação. Tente novamente.');
    }
  };

  // Funções de família
  const handleCreateFamily = async (name: string) => {
    if (!appUser) return;
    
    try {
      const family = await familiesService.createFamily(name, appUser.id);
      if (family) {
        await loadFamilies();
        alert(`Família criada! Código: ${family.join_code}`);
      } else {
        alert('Erro ao criar família.');
      }
    } catch (error) {
      console.error('Error creating family:', error);
      alert('Erro ao criar família.');
    }
  };

  const handleJoinFamily = async (code: string) => {
    if (!appUser) return;
    
    try {
      const success = await familiesService.joinFamily(code, appUser.id);
      if (success) {
        await loadFamilies();
        alert('Você entrou na família!');
      } else {
        alert('Código inválido ou família não encontrada.');
      }
    } catch (error) {
      console.error('Error joining family:', error);
      alert('Erro ao entrar na família.');
    }
  };

  // Membros: usuário atual + membros de todas as famílias
  const allFamilyMembers = useMemo(() => {
    const membersMap = new Map();
    
    // Adicionar usuário atual
    if (appUser) {
      membersMap.set(appUser.id, appUser);
    }
    
    // Adicionar membros das famílias
    families.forEach(family => {
      family.members.forEach(member => {
        if (!membersMap.has(member.id)) {
          membersMap.set(member.id, member);
        }
      });
    });
    
    return Array.from(membersMap.values());
  }, [appUser, families]);

  // Família principal (primeira da lista) ou mock
  const primaryFamily = families[0] || FAMILY_MOCK;

  return (
    <div className="min-h-screen bg-black text-white pb-32 animate-fade-in overflow-x-hidden">
      <header className="px-6 safe-pt pt-12 pb-4 flex justify-between items-center">
        <div>
          <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{primaryFamily.name}</p>
          <h1 className="text-4xl font-black tracking-tighter">
            {activeTab === 'resumo' && 'Visão Geral'}
            {activeTab === 'histórico' && 'Histórico'}
            {activeTab === 'orçamentos' && 'Limites'}
            {activeTab === 'família' && 'Família'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleLogout} className="bg-white/10 p-3 rounded-full border border-white/5 hover:bg-white/20 transition-colors active:scale-95">
            <LogOut size={20} className="text-rose-500" />
          </button>
          <div className="bg-white/10 p-3 rounded-full border border-white/5">
            <BrainCircuit size={20} className="text-blue-500" />
          </div>
        </div>
      </header>

      <main className="px-6 space-y-8">
        {activeTab === 'resumo' && (
          <div className="space-y-8">
            <MonthSelector />
            <div className="glass rounded-[2.5rem] p-6 bg-gradient-to-br from-emerald-600/20 to-transparent border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Saldo em Carteira</span>
              </div>
              {isLoadingWallet ? (
                <div className="flex items-center gap-3 py-4">
                  <Loader2 size={24} className="animate-spin text-emerald-400" />
                  <span className="text-sm text-zinc-500">Calculando...</span>
                </div>
              ) : walletError ? (
                <p className="text-sm text-rose-300 py-2">{walletError}</p>
              ) : (
                <>
                  <h2 className="text-5xl font-black mb-1 tracking-tighter">
                    R$ {(walletBalance?.balance ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h2>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Total acumulado da família</p>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black">
                      <ArrowUpRight size={14} /> R$ {(walletBalance?.income ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-black">
                      <ArrowDownLeft size={14} /> R$ {(walletBalance?.expense ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="glass rounded-[2.5rem] p-6 bg-gradient-to-br from-blue-600/20 to-transparent border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-blue-400" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Saldo do Mês</span>
              </div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{periodLabel}</p>
              <h2 className="text-4xl font-black mb-4 tracking-tighter">R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black"><ArrowUpRight size={14} /> R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-black"><ArrowDownLeft size={14} /> R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter"><Sparkles size={22} className="text-amber-400" /> Consultoria IA</h3>
              {aiError && (
                <div className="glass rounded-2xl p-4 border-rose-500/20 bg-rose-500/10 text-sm text-rose-300 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {aiError}
                </div>
              )}
              {!aiAnalysis ? (
                <button onClick={handleAiAnalysis} disabled={isAiLoading} className="w-full glass rounded-3xl p-6 border-blue-500/20 bg-gradient-to-r from-blue-600/10 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl">{isAiLoading ? <Loader2 className="animate-spin" /> : <BrainCircuit />}</div>
                    <div className="text-left"><p className="text-sm font-black">Análise do Consultor</p><p className="text-[10px] text-zinc-500">Avaliar {periodLabel}</p></div>
                  </div>
                  <ChevronRight size={20} className="text-zinc-600" />
                </button>
              ) : (
                <div className="glass rounded-3xl p-6 border-white/10 bg-white/5 animate-scale-in text-sm text-zinc-200 leading-relaxed">
                  {aiAnalysis}
                  <button onClick={() => { setAiAnalysis(null); setAiError(null); }} className="mt-4 block text-[9px] font-black text-zinc-600 uppercase">Recalcular</button>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter"><BarChart3 size={22} className="text-blue-500" /> Performance Familiar</h3>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                <MetricCard title="Poupança" value={`${stats.savingsRate.toFixed(1)}%`} subValue="Meta: 20%" icon={<Target size={18} />} color="#10B981" />
                <MetricCard title="Investido" value={`R$ ${stats.totalInv.toLocaleString()}`} subValue="Aporte Família" icon={<PieIcon size={18} />} color="#8B5CF6" />
                <MetricCard title="Entradas" value={`R$ ${stats.income.toLocaleString()}`} subValue="Total Membros" icon={<ArrowUpRight size={18} />} color="#3B82F6" />
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter"><TrendingUp size={22} className="text-emerald-500" /> Fluxo de Gastos</h3>
              {isLoadingTransactions ? (
                <div className="flex justify-center py-8"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
              ) : transactionsError ? (
                <div className="glass rounded-2xl p-4 border-rose-500/20 text-sm text-rose-300">{transactionsError}</div>
              ) : (
                <TrendChart data={trendData} />
              )}
            </section>

            <section className="space-y-6">
              <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter"><Activity size={22} className="text-blue-500" /> Categorias</h3>
              {categoryData.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center text-zinc-500 text-sm">Nenhum gasto em {periodLabel}.</div>
              ) : (
                <DonutChart data={categoryData} />
              )}
            </section>
          </div>
        )}

        {activeTab === 'histórico' && (
          <div className="space-y-6">
            <MonthSelector />
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <Search size={20} className="text-zinc-600" />
              <input type="text" placeholder="Filtrar por membro ou descrição..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none outline-none w-full text-white font-bold" />
            </div>
            {isLoadingTransactions ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-500" />
              </div>
            ) : transactionsError ? (
              <div className="text-center py-12">
                <AlertCircle size={32} className="mx-auto text-rose-500 mb-3" />
                <p className="text-zinc-500 font-bold">{transactionsError}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {periodTransactions
                  .filter(t => t.description.toLowerCase().includes(search.toLowerCase()))
                  .map((t, i) => (
                    <TransactionItem
                      key={t.id}
                      transaction={t}
                      index={i}
                      familyMembers={allFamilyMembers}
                      currentUserId={appUser?.id}
                      onEdit={openEditModal}
                      onDelete={handleDeleteTransaction}
                    />
                  ))}
                {periodTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-zinc-500 font-bold">Nenhuma transação em {periodLabel}.</p>
                    <p className="text-xs text-zinc-600 mt-2">Clique no botão + para adicionar ou navegue para outro mês.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orçamentos' && (
          <div className="space-y-6">
            <MonthSelector />
            <div className="glass rounded-[2.5rem] p-8 bg-gradient-to-br from-emerald-600/10 to-transparent border-white/5">
              <h2 className="text-4xl font-black tracking-tighter mb-2">Monitoramento</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Limites definidos para toda a residência.</p>
            </div>
            <div className="space-y-4">
              {budgets.map(b => {
                const spent = periodTransactions.filter(t => t.category === b.category && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                return <BudgetProgressCard key={b.category} budget={b} spent={spent} onDelete={cat => { budgetStorageService.removeBudget(cat); setBudgets(budgetStorageService.getBudgets()); }} />;
              })}
            </div>
            <button onClick={() => setIsBudgetModalOpen(true)} className="w-full py-5 glass rounded-[2rem] border-blue-500/20 text-blue-400 font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
              <Plus size={20} strokeWidth={3} /> Adicionar Limite
            </button>
          </div>
        )}

        {activeTab === 'família' && (
          <div className="space-y-8 animate-fade-in">
            <MonthSelector />
            {families.length > 0 ? (
              <>
                {families.map(family => (
                  <div key={family.id} className="space-y-6">
                    <div className="glass rounded-[2.5rem] p-6 border-blue-500/20 bg-blue-600/5">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{family.name}</span>
                        <Share2 size={16} className="text-blue-500" />
                      </div>
                      <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                        <code className="text-lg font-black tracking-widest text-blue-400">{family.join_code}</code>
                        <button className="p-2 bg-blue-600/20 rounded-xl text-blue-400 text-xs font-bold" onClick={() => navigator.clipboard.writeText(family.join_code)}>
                          Copiar
                        </button>
                      </div>
                    </div>
                    <section>
                      <h3 className="text-xl font-black mb-6 flex items-center gap-2 tracking-tighter">
                        <Users size={22} className="text-blue-500" /> Membros ({family.members.length})
                      </h3>
                      <div className="space-y-4">
                        {family.members.map(member => {
                          // Calcular consumo do mês: filtrar transações do membro no mês selecionado
                          // filteredTransactions já está filtrado por mês, só precisamos filtrar por membro e tipo
                          const memberTransactions = periodTransactions.filter(t => t.user_id === member.id && t.type === 'expense');
                          const memberSpent = memberTransactions.reduce((sum, t) => {
                            const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
                            return sum + (amount || 0);
                          }, 0);

                          return (
                            <div key={member.id} className="glass p-5 rounded-[2rem] flex items-center justify-between bg-white/5">
                              <div className="flex items-center gap-4">
                                <img src={member.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                                <div>
                                  <h4 className="font-bold text-sm flex items-center gap-2">
                                    {member.name} 
                                    {appUser && member.id === appUser.id && <span className="text-blue-500">(Você)</span>}
                                    {member.role === 'admin' && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-lg font-black">ADMIN</span>}
                                  </h4>
                                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{member.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-rose-400">
                                  R$ {memberSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <p className="text-[8px] font-bold text-zinc-500 uppercase">Consumo Mês</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Users size={48} className="mx-auto text-zinc-700" />
                <div>
                  <p className="text-zinc-500 font-bold">Nenhuma família ainda</p>
                  <p className="text-xs text-zinc-600 mt-2">Crie uma nova ou entre com um código</p>
                </div>
              </div>
            )}
            <button 
              onClick={() => setIsFamilyModalOpen(true)}
              className="w-full glass rounded-[2rem] p-5 border-blue-500/20 hover:bg-blue-600/10 transition-all active:scale-[0.98] flex items-center justify-center gap-3 font-black text-sm"
            >
              <Plus size={20} strokeWidth={3} /> Criar ou Entrar em Família
            </button>
          </div>
        )}
      </main>

      <button onClick={openCreateModal} className="fixed bottom-28 right-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl z-40 active:scale-90 transition-transform"><Plus size={32} strokeWidth={4} className="text-white" /></button>

      <nav className="fixed bottom-0 left-0 right-0 h-24 glass-dark px-6 flex items-center justify-around z-30 pb-[safe-area-inset-bottom]">
         {[
           {id: 'resumo', icon: <Activity size={24} />, label: 'Início'},
           {id: 'histórico', icon: <History size={24} />, label: 'Histórico'},
           {id: 'orçamentos', icon: <Target size={24} />, label: 'Limites'},
           {id: 'família', icon: <Users size={24} />, label: 'Família'}
         ].map(tab => (
           <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === tab.id ? 'text-blue-500 scale-110 font-black' : 'text-zinc-700'}`}>
             {tab.icon}<span className="text-[8px] font-black uppercase tracking-widest">{tab.label}</span>
           </button>
         ))}
      </nav>

      {appUser && (
        <>
          <TransactionModal 
            isOpen={isModalOpen || !!editingTransaction} 
            onClose={closeTransactionModal} 
            onSave={handleSaveTransaction}
            transaction={editingTransaction}
          />
          <BudgetModal 
            isOpen={isBudgetModalOpen} 
            onClose={() => setIsBudgetModalOpen(false)} 
            onSave={b => { budgetStorageService.saveBudget(b); setBudgets(budgetStorageService.getBudgets()); }} 
          />
          <FamilyModal
            isOpen={isFamilyModalOpen}
            onClose={() => setIsFamilyModalOpen(false)}
            onCreateFamily={handleCreateFamily}
            onJoinFamily={handleJoinFamily}
          />
        </>
      )}
    </div>
  );
};

// --- ROOT COM AUTENTICAÇÃO ---
const AppWrapper: React.FC = () => {
  const { appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-zinc-500 font-bold text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!appUser) {
    return <AuthScreen />;
  }

  return (
    <PeriodProvider>
      <App />
    </PeriodProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <AuthProvider>
    <AppWrapper />
  </AuthProvider>
);
