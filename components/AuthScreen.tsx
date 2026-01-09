import React, { useState, useMemo } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
        }
      } else {
        if (!name.trim()) {
          setError('Por favor, informe seu nome.');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name);
        if (error) {
          setError(error.message || 'Erro ao criar conta. Tente novamente.');
        } else {
          setError('Conta criada! Verifique seu e-mail para confirmar.');
        }
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = useMemo(() => {
    if (isLogin) {
      return email.length > 0 && password.length >= 6;
    }
    return email.length > 0 && password.length >= 6 && name.trim().length > 0;
  }, [email, password, name, isLogin]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 overflow-hidden">
      {/* Background Gradient Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] glass border-white/10 mb-4">
            <Sparkles size={40} className="text-blue-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">Finança</h1>
          <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">Controle Familiar</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-[3rem] p-8 border-white/10">
          {/* Toggle Login/Register */}
          <div className="flex p-1.5 bg-white/5 rounded-2xl border border-white/5 mb-8">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-black uppercase transition-all ${
                isLogin ? 'bg-blue-600 text-white' : 'text-zinc-500'
              }`}
            >
              <LogIn size={16} className="inline mr-2" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 py-3 rounded-xl text-sm font-black uppercase transition-all ${
                !isLogin ? 'bg-blue-600 text-white' : 'text-zinc-500'
              }`}
            >
              <UserPlus size={16} className="inline mr-2" />
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field (only for signup) */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Seu Nome</label>
                <div className="relative">
                  <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Como devemos te chamar?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white font-bold outline-none focus:border-blue-500 transition-colors"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">E-mail</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white font-bold outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Senha</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-white font-bold outline-none focus:border-blue-500 transition-colors"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {!isLogin && (
                <p className="text-[10px] text-zinc-600 font-bold">Mínimo de 6 caracteres</p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className={`p-4 rounded-2xl border ${
                error.includes('criada') 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              } text-sm font-bold animate-scale-in`}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-2 ${
                isFormValid && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 active:scale-95'
                  : 'bg-white/5 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processando...
                </>
              ) : isLogin ? (
                <>
                  <LogIn size={20} />
                  Entrar
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Criar Conta
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-center text-xs text-zinc-600 font-bold">
              {isLogin ? 'Novo por aqui? ' : 'Já tem uma conta? '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-blue-500 hover:text-blue-400 transition-colors font-black"
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </div>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-[10px] text-zinc-700 font-bold mt-6">
          Seus dados são protegidos com criptografia de ponta a ponta
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
