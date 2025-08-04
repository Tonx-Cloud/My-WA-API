'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useCallback } from 'react';

export function useAuth() {
  const { data: session, status } = useSession();

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: 'Credenciais inválidas' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }, []);

  const loginWithGoogle = useCallback(async (callbackUrl?: string) => {
    try {
      await signIn('google', {
        callbackUrl: callbackUrl || '/dashboard',
      });
    } catch (error) {
      console.error('Erro no login Google:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut({
        callbackUrl: '/login',
      });
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }, []);

  return {
    user: session?.user,
    loading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    loginWithGoogle,
    logout,
  };
}
