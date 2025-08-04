'use client';

import { useSession } from 'next-auth/react';
import { useStableCallback } from './useStableCallback';
import { signIn, signOut } from 'next-auth/react';

/**
 * Hook de autenticaÃ§Ã£o otimizado que previne loops infinitos
 * Implementa as melhores prÃ¡ticas do GitHub para resolver "Maximum update depth exceeded"
 */
export function useAuthOptimized() {
  const { data: session, status } = useSession();

  // FunÃ§Ãµes estÃ¡veis que nÃ£o causam re-renderizaÃ§Ãµes
  const login = useStableCallback(async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: 'Credenciais invÃ¡lidas' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  });

  const loginWithGoogle = useStableCallback(async (callbackUrl?: string) => {
    try {
      await signIn('google', {
        callbackUrl: callbackUrl || '/dashboard',
      });
    } catch (error) {
      console.error('Erro no login Google:', error);
      throw error;
    }
  });

  const logout = useStableCallback(async () => {
    try {
      await signOut({
        callbackUrl: '/login',
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  });

  return {
    user: session?.user,
    loading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    loginWithGoogle,
    logout,
  };
}
