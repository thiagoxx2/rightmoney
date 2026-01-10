import React, { useState } from 'react';
import { Users, Share2, X, Loader2 } from 'lucide-react';

interface FamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFamily: (name: string) => Promise<void>;
  onJoinFamily: (code: string) => Promise<void>;
}

const FamilyModal: React.FC<FamilyModalProps> = ({ isOpen, onClose, onCreateFamily, onJoinFamily }) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [familyName, setFamilyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'create') {
        await onCreateFamily(familyName);
        setFamilyName('');
      } else {
        await onJoinFamily(joinCode.toUpperCase());
        setJoinCode('');
      }
      onClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full glass rounded-t-[3rem] p-8 pb-12 animate-slide-up safe-pb max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black tracking-tighter">Família</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Toggle Create/Join */}
        <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${
              mode === 'create' ? 'bg-blue-500 text-white' : 'text-zinc-500'
            }`}
          >
            <Users className="inline mr-2" size={16} />
            Criar
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${
              mode === 'join' ? 'bg-emerald-500 text-white' : 'text-zinc-500'
            }`}
          >
            <Share2 className="inline mr-2" size={16} />
            Entrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'create' ? (
            <div>
              <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">
                Nome da Família
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Ex: Residência Silva"
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">
                Código de Convite
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC12345"
                maxLength={8}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold placeholder-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors uppercase text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-zinc-600 mt-2 text-center">
                Peça o código para um membro da família
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'create' ? !familyName : !joinCode)}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all ${
              mode === 'create'
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-emerald-500 hover:bg-emerald-600'
            } disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
          >
            {loading ? (
              <Loader2 className="animate-spin mx-auto" size={20} />
            ) : mode === 'create' ? (
              'Criar Família'
            ) : (
              'Entrar na Família'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FamilyModal;
