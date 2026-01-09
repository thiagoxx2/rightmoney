import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'member';
}

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (name: string, avatar?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar dados do perfil do usuário
  const loadUserProfile = async (userId: string, userEmail?: string, userName?: string) => {
    try {
      // Usar maybeSingle() ao invés de single() para não dar erro se não existir
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // Se for outro erro além de "não encontrado", logar
        console.error('Error loading user profile:', error);
      }

      if (data) {
        // Perfil existe, usar os dados
        setAppUser({
          id: data.id,
          name: data.name || 'Usuário',
          email: data.email,
          avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          role: data.role || 'member'
        });
      } else {
        // Perfil não existe, criar automaticamente
        const nameToUse = userName || userEmail?.split('@')[0] || 'Usuário';
        const emailToUse = userEmail || '';
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: emailToUse,
            name: nameToUse,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            role: 'admin'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Mesmo com erro, criar perfil local para não quebrar o app
          setAppUser({
            id: userId,
            name: nameToUse,
            email: emailToUse,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            role: 'admin'
          });
        } else if (newProfile) {
          // Perfil criado com sucesso
          setAppUser({
            id: newProfile.id,
            name: newProfile.name || nameToUse,
            email: newProfile.email || emailToUse,
            avatar: newProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            role: newProfile.role || 'admin'
          });
        }
      }
    } catch (error) {
      console.error('Unexpected error loading user profile:', error);
      // Fallback: criar perfil local
      if (user) {
        setAppUser({
          id: user.id,
          name: user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          role: 'admin'
        });
      }
    }
  };

  // Verificar sessão ao carregar
  useEffect(() => {
    // Pegar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email, session.user.user_metadata?.name);
      }
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email, session.user.user_metadata?.name);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (error) return { error };

      // Criar perfil do usuário
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          name: name,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.id}`,
          role: 'admin'
        });

        if (profileError) {
          console.error('Error creating profile during signup:', profileError);
          // Não retornar erro aqui, o perfil será criado no próximo login
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAppUser(null);
    setSession(null);
  };

  const updateProfile = async (name: string, avatar?: string) => {
    if (!user) return;

    try {
      const updates: any = {
        id: user.id,
        name,
        updated_at: new Date().toISOString(),
      };

      if (avatar) {
        updates.avatar_url = avatar;
      }

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;

      // Atualizar estado local
      setAppUser(prev => prev ? { ...prev, name, ...(avatar && { avatar }) } : null);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    appUser,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
