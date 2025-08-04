'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthOptimized } from '@/hooks/useAuthOptimized';
import { useStableCallback, useOnce } from '@/hooks/useStableCallback';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

/**
 * Componente de login otimizado seguindo melhores práticas do GitHub
 * para prevenir "Maximum update depth exceeded"
 */
export default function LoginPageOptimized() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs para controlar execução única
  const hasProcessedUrlError = useRef(false);
  const hasRedirectedWhenAuth = useRef(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, loading, isAuthenticated } = useAuthOptimized();

  // Processar erros de URL apenas uma vez - usa useOnce para garantir execução única
  useOnce(() => {
    const errorParam = searchParams.get('error');
    if (errorParam && !hasProcessedUrlError.current) {
      hasProcessedUrlError.current = true;
      const errorMessages: Record<string, string> = {
        OAuthSignin: 'Erro ao iniciar autenticação com Google',
        OAuthCallback: 'Erro no callback do Google',
        OAuthCreateAccount: 'Erro ao criar conta com Google',
        EmailCreateAccount: 'Erro ao criar conta',
        Callback: 'Erro na autenticação',
        OAuthAccountNotLinked: 'Conta não vinculada. Use o mesmo método de login anterior.',
        EmailSignin: 'Erro no envio do email',
        CredentialsSignin: 'Credenciais inválidas',
        SessionRequired: 'Sessão requerida',
        Default: 'Erro na autenticação',
      };
      setError((errorMessages[errorParam] || errorMessages['Default']) ?? 'Erro na autenticação');
    }
  });

  // Redirecionamento controlado
  useEffect(() => {
    if (isAuthenticated && !loading && !hasRedirectedWhenAuth.current) {
      hasRedirectedWhenAuth.current = true;
      const from = searchParams.get('from') || '/dashboard';
      router.push(from);
    }
  }, [isAuthenticated, loading, router, searchParams]); // Dependências completas

  // Callback estável para input changes
  const handleInputChange = useStableCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Limpar erro quando usuário começar a digitar
    if (error) setError('');
  });

  const handleSubmit = useStableCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || loading) return;

    setError('');
    setIsSubmitting(true);

    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);

      if (result.error) {
        setError(result.error);
      }
      // Não redirecionar aqui - deixar o useEffect lidar com isso
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro interno do servidor');
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleGoogleLogin = useStableCallback(async () => {
    if (isSubmitting || loading) return;

    setError('');
    setIsSubmitting(true);

    try {
      const from = searchParams.get('from') || '/dashboard';
      await loginWithGoogle(from);
    } catch (error) {
      console.error('Erro no login Google:', error);
      setError('Erro ao fazer login com Google');
      setIsSubmitting(false);
    }
  });

  // Loading state com verificação de autenticação
  if (loading && !error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My-wa-API</h1>
          <h2 className="text-xl text-gray-600 mb-8">Faça login em sua conta</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Digite seu email"
                disabled={isSubmitting || loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-4 py-3 pr-12 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Digite sua senha"
                  disabled={isSubmitting || loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || loading}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Ou continue com</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting || loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com Google
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-500 hover:underline font-medium"
              >
                Cadastre-se
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
