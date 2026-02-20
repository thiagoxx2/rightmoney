import { supabase } from './supabase';

export interface FamilyGroup {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface FamilyWithMembers extends FamilyGroup {
  members: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: 'admin' | 'member';
  }[];
}

// Gera código único de 8 caracteres
function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export const familiesService = {
  // Criar nova família
  async createFamily(name: string, userId: string): Promise<FamilyGroup | null> {
    try {
      const joinCode = generateJoinCode();
      
      // 1. Criar o grupo
      const { data: family, error: familyError } = await supabase
        .from('family_groups')
        .insert({
          name,
          join_code: joinCode,
          created_by: userId
        })
        .select()
        .single();

      if (familyError) throw familyError;

      // 2. Adicionar criador como admin
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: userId,
          role: 'admin'
        });

      if (memberError) throw memberError;

      return family as FamilyGroup;
    } catch (error) {
      console.error('Error creating family:', error);
      return null;
    }
  },

  // Entrar em família com código
  async joinFamily(joinCode: string, userId: string): Promise<boolean> {
    try {
      // 1. Buscar família pelo código
      const { data: family, error: familyError } = await supabase
        .from('family_groups')
        .select('id')
        .eq('join_code', joinCode)
        .single();

      if (familyError || !family) return false;

      // 2. Verificar se já é membro
      const { data: existing } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', family.id)
        .eq('user_id', userId)
        .single();

      if (existing) return true; // Já é membro

      // 3. Adicionar como membro
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: userId,
          role: 'member'
        });

      if (memberError) throw memberError;

      return true;
    } catch (error) {
      console.error('Error joining family:', error);
      return false;
    }
  },

  // Buscar famílias do usuário
  async getMyFamilies(userId: string): Promise<FamilyWithMembers[]> {
    try {
      // 1. Buscar IDs das famílias que o usuário pertence
      const { data: memberships, error: memberError } = await supabase
        .from('family_members')
        .select('family_id, role')
        .eq('user_id', userId);

      if (memberError || !memberships || memberships.length === 0) return [];

      const familyIds = memberships.map(m => m.family_id);

      // 2. Buscar dados das famílias
      const { data: families, error: familyError } = await supabase
        .from('family_groups')
        .select('*')
        .in('id', familyIds);

      if (familyError || !families) return [];

      // 3. Para cada família, buscar membros
      const familiesWithMembers = await Promise.all(
        families.map(async (family) => {
          const members = await this.getFamilyMembers(family.id);
          return {
            ...family,
            members
          } as FamilyWithMembers;
        })
      );

      return familiesWithMembers;
    } catch (error) {
      console.error('Error getting families:', error);
      return [];
    }
  },

  // Buscar membros de uma família
  async getFamilyMembers(familyId: string): Promise<FamilyWithMembers['members']> {
    try {
      console.log('🔍 Buscando membros da família:', familyId);
      
      // 1. Buscar membros da família
      const { data: members, error: membersError } = await supabase
        .from('family_members')
        .select('user_id, role')
        .eq('family_id', familyId);

      if (membersError) {
        console.error('❌ Erro ao buscar membros:', membersError);
        return [];
      }

      if (!members || members.length === 0) {
        console.log('⚠️ Nenhum membro encontrado para família:', familyId);
        return [];
      }

      console.log('✅ Membros encontrados:', members.length, members);

      // 2. Buscar perfis de todos os membros
      const userIds = members.map(m => m.user_id);
      console.log('🔍 Buscando perfis para usuários:', userIds);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('❌ Erro ao buscar perfis:', profilesError);
        return [];
      }

      if (!profiles || profiles.length === 0) {
        console.warn('⚠️ Nenhum perfil encontrado para os membros');
        return [];
      }

      console.log('✅ Perfis encontrados:', profiles.length, profiles);

      // 3. Combinar dados: membro + perfil
      const membersMap = new Map(profiles.map(p => [p.id, p]));
      
      const result = members
        .map(member => {
          const profile = membersMap.get(member.user_id);
          if (!profile) {
            console.warn(`⚠️ Perfil não encontrado para user_id: ${member.user_id}`);
            return null;
          }
          return {
            id: profile.id,
            name: profile.name || 'Sem nome',
            email: profile.email || '',
            avatar: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`,
            role: member.role
          };
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);

      console.log('✅ Membros finais retornados:', result.length, result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar membros da família:', error);
      return [];
    }
  },

  // Sair da família
  async leaveFamily(familyId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving family:', error);
      return false;
    }
  }
};
