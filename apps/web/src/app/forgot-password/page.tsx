'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env['NEXT_PUBLIC_BACKEND_URL'] || 'http://localhost:3000'}/api/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          'Se o email existir em nossa base, você receberá instruções para redefinir sua senha.'
        );
      } else {
        setError(data.error || 'Erro ao enviar email de recuperação');
      }
    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m-2-2l-2.5-2.5a2.121 2.121 0 00-3 3L12 10m-4.5-4.5a2.121 2.121 0 00-3 3L7 11m0 0l4.5 4.5m0 0v3h3m-3-3h3m-3 3l-3-3m-6-6a9 9 0 1118 0 9 9 0 01-18 0z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Esqueceu sua senha?</h2>
            <p className="text-gray-600">
              Digite seu email e enviaremos instruções para redefinir sua senha
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-600 text-sm">{message}</p>
              </div>
            )}

            {/* Email */}
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
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="seu@email.com"
              />
            </div>

            {/* Botão de envio */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Enviando...' : 'Enviar instruções'}
            </button>
          </form>

          {/* Links de navegação */}
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <Link href="/login" className="text-blue-600 hover:text-blue-500 font-medium">
                ← Voltar para login
              </Link>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>
                Não tem uma conta?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Não recebeu o email?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Verifique sua caixa de spam</li>
              <li>• Certifique-se de que o email está correto</li>
              <li>• Aguarde alguns minutos antes de tentar novamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
