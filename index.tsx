
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Plus, Wallet, ArrowUpRight, ArrowDownLeft, Activity, 
  TrendingUp, History, Trash2, Search, Check, AlertCircle, Sparkles,
  Target, BarChart3, PieChart as PieIcon, Calendar, BrainCircuit,
  Loader2, ChevronRight, MessageSquare, LayoutGrid, Gauge, Users,
  User as UserIcon, Share2, ShieldCheck, LogOut, TrendingDown
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, AreaChart, Area, XAxis, YAxis
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- 1. CONFIGURAÇÕES E TIPOS (SUPABASE READY) ---

const INCOME_CATEGORIES = [
  'Salário', 'Pro-labore', 'Dividendos', 'Investimentos', 'Empresa', 'Vendas', 'Outros'
] as const;

const EXPENSE_CATEGORIES = [
  'Mercado', 'Lanche', 'Lazer', 'Transporte', 'Saúde', 'Educação', 
  'E-commerce', 'Compras Físicas', 'Investimentos', 'Empresa', 
  'Moradia', 'Assinaturas', 'Pet', 'Bem-estar', 'Outros'
] as const;

type IncomeCategory = typeof INCOME_CATEGORIES[number];
type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
type Category = IncomeCategory | ExpenseCategory;

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

interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: string;
  category: Category;
  type: 'income' | 'expense';
}

interface Budget {
  category: ExpenseCategory;
  limit: number;
}

const COLORS = ['#3B82F6', '#60A5FA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

// --- 2. DADOS E USUÁRIO ---
const CURRENT_USER: AppUser = {
  id: 'u-1',
  name: 'Você',
  email: 'voce@familia.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  role: 'admin'
};

const FAMILY_MOCK: FamilyGroup = {
  id: 'fam-999',
  name: 'Residência Silva',
  joinCode: 'SILVA-2025-XP',
  members: [
    CURRENT_USER,
    { id: 'u-2', name: 'Mariana', email: 'mari@familia.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mari', role: 'member' },
    { id: 'u-3', name: 'Lucas', email: 'lucas@familia.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas', role: 'member' }
  ]
};

// --- FUNÇÃO PARA GERAR DADOS MOCK ---
const generateMockTransactions = (): Transaction[] => {
  const now = new Date();
  const getD = (daysAgo: number) => {
    const d = new Date();
    d.setDate(now.getDate() - daysAgo);
    return d.toISOString();
  };

  return [
    // Receitas
    { id: 't1', userId: 'u-1', description: 'Salário Sênior', amount: 12500, date: getD(10), category: 'Salário', type: 'income' },
    { id: 't2', userId: 'u-2', description: 'Vendas Freelance', amount: 3200, date: getD(5), category: 'Vendas', type: 'income' },
    
    // Gastos Essenciais e Investimentos (Admin)
    { id: 't3', userId: 'u-1', description: 'Aluguel & Condomínio', amount: 3500, date: getD(8), category: 'Moradia', type: 'expense' },
    { id: 't4', userId: 'u-1', description: 'Aporte ETF IVVB11', amount: 2500, date: getD(4), category: 'Investimentos', type: 'expense' },
    { id: 't5', userId: 'u-1', description: 'Supermercado Mensal', amount: 1200, date: getD(1), category: 'Mercado', type: 'expense' },
    
    // Gastos Mariana
    { id: 't6', userId: 'u-2', description: 'Curso UX Design', amount: 850, date: getD(6), category: 'Educação', type: 'expense' },
    { id: 't7', userId: 'u-2', description: 'Farmácia', amount: 120, date: getD(3), category: 'Saúde', type: 'expense' },
    
    // Gastos Lucas
    { id: 't8', userId: 'u-3', description: 'PS Plus & Netflix', amount: 145, date: getD(7), category: 'Assinaturas', type: 'expense' },
    { id: 't9', userId: 'u-3', description: 'Jantar Japonês', amount: 280, date: getD(2), category: 'Lanche', type: 'expense' },
    { id: 't10', userId: 'u-3', description: 'Uber Final de Semana', amount: 95, date: getD(0), category: 'Transporte', type: 'expense' },
  ];
};

const INITIAL_BUDGETS: Budget[] = [
  { category: 'Mercado', limit: 2000 },
  { category: 'Lanche', limit: 500 },
  { category: 'Investimentos', limit: 3000 },
  { category: 'Transporte', limit: 400 }
];

// --- 3. PERSISTÊNCIA ---
const STORAGE_KEY = 'financa_family_v3';
const BUDGET_KEY = 'financa_budgets_v3';

const storageService = {
  get: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const mocks = generateMockTransactions();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mocks));
      return mocks;
    }
    return JSON.parse(data);
  },
  save: (t: Transaction) => {
    const all = storageService.get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([t, ...all]));
  },
  remove: (id: string) => {
    const filtered = storageService.get().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },
  getBudgets: (): Budget[] => {
    const data = localStorage.getItem(BUDGET_KEY);
    if (!data) {
      localStorage.setItem(BUDGET_KEY, JSON.stringify(INITIAL_BUDGETS));
      return INITIAL_BUDGETS;
    }
    return JSON.parse(data);
  },
  saveBudget: (b: Budget) => {
    const all = storageService.getBudgets().filter(x => x.category !== b.category);
    localStorage.setItem(BUDGET_KEY, JSON.stringify([...all, b]));
  },
  removeBudget: (category: string) => {
    const filtered = storageService.getBudgets().filter(b => b.category !== category);
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
  index: number;
  familyMembers: AppUser[];
}> = ({ transaction, onDelete, index, familyMembers }) => {
  const member = familyMembers.find(m => m.id === transaction.userId);

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
          {transaction.type === 'income' ? '+' : '-'} {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <button onClick={() => { if(confirm('Remover este lançamento?')) onDelete(transaction.id); }} className="p-2 text-zinc-800 hover:text-rose-500 transition-colors">
          <Trash2 size={16} />
        </button>
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

const TrendChart: React.FC<{ data: any[] }> = ({ data }) => (
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

const DonutChart: React.FC<{ data: any[] }> = ({ data }) => {
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

const TransactionModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (t: Transaction) => void }> = ({ isOpen, onClose, onSave }) => {
  const [desc, setDesc] = useState('');
  const [rawAmount, setRawAmount] = useState('0'); 
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [cat, setCat] = useState<Category>(EXPENSE_CATEGORIES[0]);
  const formattedValue = useMemo(() => (parseInt(rawAmount) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), [rawAmount]);

  useEffect(() => { setCat(type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]); }, [type]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full glass rounded-t-[3rem] p-8 pb-12 animate-slide-up safe-pb max-h-[92vh] flex flex-col">
        <h2 className="text-2xl font-black mb-6 tracking-tighter">Novo Lançamento</h2>
        <form onSubmit={e => { e.preventDefault(); onSave({ id: crypto.randomUUID(), userId: CURRENT_USER.id, description: desc || 'Sem descrição', amount: parseInt(rawAmount)/100, category: cat, type, date: new Date().toISOString() }); setDesc(''); setRawAmount('0'); onClose(); }} className="space-y-6 overflow-y-auto no-scrollbar">
          <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5">
            <button type="button" onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${type === 'expense' ? 'bg-rose-500 text-white' : 'text-zinc-500'}`}>Despesa</button>
            <button type="button" onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase ${type === 'income' ? 'bg-emerald-500 text-white' : 'text-zinc-500'}`}>Receita</button>
          </div>
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="O que você comprou?" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none" required />
          <div className="relative">
            <input type="tel" value={formattedValue} onChange={e => setRawAmount(e.target.value.replace(/\D/g, '') || '0')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-4xl font-black text-center outline-none" required />
            <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-black text-zinc-500 uppercase">Valor</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
              <button key={c} type="button" onClick={() => setCat(c)} className={`py-3 px-1 rounded-xl text-[9px] font-black uppercase border transition-all truncate ${cat === c ? 'bg-white/20 border-white/30 text-white' : 'border-white/5 text-zinc-600'}`}>{c}</button>
            ))}
          </div>
          <button type="submit" className={`w-full py-5 rounded-[2rem] font-black text-lg flex items-center justify-center gap-2 ${type === 'income' ? 'bg-emerald-600' : 'bg-blue-600'}`}>Confirmar {type === 'income' ? 'Receita' : 'Gasto'}</button>
        </form>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'resumo' | 'histórico' | 'orçamentos' | 'família'>('resumo');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; });

  useEffect(() => { setTransactions(storageService.get()); setBudgets(storageService.getBudgets()); }, []);

  const filteredTransactions = useMemo(() => transactions.filter(t => t.date.startsWith(selectedMonth)), [transactions, selectedMonth]);

  const stats = useMemo(() => {
    const s = filteredTransactions.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
    const totalInv = filteredTransactions.filter(t => t.category === 'Investimentos').reduce((acc, t) => acc + t.amount, 0);
    return { ...s, balance: s.income - s.expense, usageRate: s.income > 0 ? (s.expense / s.income) * 100 : 0, totalInv, savingsRate: s.income > 0 ? (totalInv / s.income) * 100 : 0 };
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const map = new Map<Category, number>();
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => map.set(t.category, (map.get(t.category) || 0) + t.amount));
    return Array.from(map.entries()).map(([category, total]) => ({ category, total }));
  }, [filteredTransactions]);

  const trendData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(year, month - 1, now().getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const amount = filteredTransactions.filter(t => t.date.startsWith(dStr) && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return { day: dStr, amount };
    }).reverse();
  }, [filteredTransactions, selectedMonth]);

  function now() { return new Date(); }

  const handleAiAnalysis = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise a saúde financeira familiar: Receita R$ ${stats.income}, Despesa R$ ${stats.expense}, Investimentos R$ ${stats.totalInv}. Categorias: ${categoryData.map(c => c.category + ': R$ ' + c.total).join(', ')}. Responda como um CFO familiar em Português do Brasil, curto e motivador.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiAnalysis(response.text || "Análise indisponível.");
    } catch (e) { setAiAnalysis("Erro na análise."); }
    finally { setIsAiLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32 animate-fade-in overflow-x-hidden">
      <header className="px-6 safe-pt pt-12 pb-4 flex justify-between items-center">
        <div>
          <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{FAMILY_MOCK.name}</p>
          <h1 className="text-4xl font-black tracking-tighter">
            {activeTab === 'resumo' && 'Visão Geral'}
            {activeTab === 'histórico' && 'Histórico'}
            {activeTab === 'orçamentos' && 'Limites'}
            {activeTab === 'família' && 'Família'}
          </h1>
        </div>
        <div className="bg-white/10 p-3 rounded-full border border-white/5"><BrainCircuit size={20} className="text-blue-500" /></div>
      </header>

      <main className="px-6 space-y-8">
        {activeTab === 'resumo' && (
          <div className="space-y-8">
            <div className="glass rounded-[2.5rem] p-6 bg-gradient-to-br from-blue-600/20 to-transparent border-white/10">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Saldo Familiar</span>
              <h2 className="text-5xl font-black mb-4 tracking-tighter">R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black"><ArrowUpRight size={14} /> R$ {stats.income.toLocaleString()}</div>
                <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-black"><ArrowDownLeft size={14} /> R$ {stats.expense.toLocaleString()}</div>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter"><Sparkles size={22} className="text-amber-400" /> Consultoria IA</h3>
              {!aiAnalysis ? (
                <button onClick={handleAiAnalysis} disabled={isAiLoading} className="w-full glass rounded-3xl p-6 border-blue-500/20 bg-gradient-to-r from-blue-600/10 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-2xl">{isAiLoading ? <Loader2 className="animate-spin" /> : <BrainCircuit />}</div>
                    <div className="text-left"><p className="text-sm font-black">Análise do Consultor</p><p className="text-[10px] text-zinc-500">Avaliar mês atual</p></div>
                  </div>
                  <ChevronRight size={20} className="text-zinc-600" />
                </button>
              ) : (
                <div className="glass rounded-3xl p-6 border-white/10 bg-white/5 animate-scale-in text-sm text-zinc-200 leading-relaxed">
                  {aiAnalysis}
                  <button onClick={() => setAiAnalysis(null)} className="mt-4 block text-[9px] font-black text-zinc-600 uppercase">Recalcular</button>
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
              <TrendChart data={trendData} />
            </section>

            <section className="space-y-6">
              <h3 className="text-xl font-black flex items-center gap-2 tracking-tighter"><Activity size={22} className="text-blue-500" /> Categorias</h3>
              <DonutChart data={categoryData} />
            </section>
          </div>
        )}

        {activeTab === 'histórico' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <Search size={20} className="text-zinc-600" />
              <input type="text" placeholder="Filtrar por membro ou descrição..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none outline-none w-full text-white font-bold" />
            </div>
            <div className="space-y-4">
              {transactions.filter(t => t.description.toLowerCase().includes(search.toLowerCase())).map((t, i) => (
                <TransactionItem key={t.id} transaction={t} index={i} familyMembers={FAMILY_MOCK.members} onDelete={(id) => { storageService.remove(id); setTransactions(storageService.get()); }} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orçamentos' && (
          <div className="space-y-6">
            <div className="glass rounded-[2.5rem] p-8 bg-gradient-to-br from-emerald-600/10 to-transparent border-white/5">
              <h2 className="text-4xl font-black tracking-tighter mb-2">Monitoramento</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-tighter">Limites definidos para toda a residência.</p>
            </div>
            <div className="space-y-4">
              {budgets.map(b => {
                const spent = filteredTransactions.filter(t => t.category === b.category && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                return <BudgetProgressCard key={b.category} budget={b} spent={spent} onDelete={cat => { storageService.removeBudget(cat); setBudgets(storageService.getBudgets()); }} />;
              })}
            </div>
            <button onClick={() => setIsBudgetModalOpen(true)} className="w-full py-5 glass rounded-[2rem] border-blue-500/20 text-blue-400 font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
              <Plus size={20} strokeWidth={3} /> Adicionar Limite
            </button>
          </div>
        )}

        {activeTab === 'família' && (
          <div className="space-y-8 animate-fade-in">
            <div className="glass rounded-[2.5rem] p-6 border-blue-500/20 bg-blue-600/5">
              <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Código da Família</span><Share2 size={16} className="text-blue-500" /></div>
              <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                <code className="text-lg font-black tracking-widest text-blue-400">{FAMILY_MOCK.joinCode}</code>
                <button className="p-2 bg-blue-600/20 rounded-xl text-blue-400" onClick={() => navigator.clipboard.writeText(FAMILY_MOCK.joinCode)}>Copiar</button>
              </div>
            </div>
            <section>
              <h3 className="text-xl font-black mb-6 flex items-center gap-2 tracking-tighter"><Users size={22} className="text-blue-500" /> Membros</h3>
              <div className="space-y-4">
                {FAMILY_MOCK.members.map(member => {
                  const memberSpent = filteredTransactions.filter(t => t.userId === member.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                  return (
                    <div key={member.id} className="glass p-5 rounded-[2rem] flex items-center justify-between bg-white/5">
                      <div className="flex items-center gap-4">
                        <img src={member.avatar} className="w-12 h-12 rounded-2xl border border-white/10" alt="" />
                        <div>
                          <h4 className="font-bold text-sm">{member.name} {member.id === CURRENT_USER.id ? '(Você)' : ''}</h4>
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-rose-400">R$ {memberSpent.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase">Consumo Mês</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-28 right-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl z-40 active:scale-90 transition-transform"><Plus size={32} strokeWidth={4} className="text-white" /></button>

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

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={t => { storageService.save(t); setTransactions(storageService.get()); }} />
      <BudgetModal isOpen={isBudgetModalOpen} onClose={() => setIsBudgetModalOpen(false)} onSave={b => { storageService.saveBudget(b); setBudgets(storageService.getBudgets()); }} />
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
