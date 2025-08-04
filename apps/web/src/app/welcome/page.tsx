'use client';

import { useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import OAuthHandler from '../../components/auth/OAuth-handler';

function WelcomeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Se há token na URL, usar o OAuth handler
  const hasToken = searchParams.get('token');

  useEffect(() => {
    if (hasToken) return; // Não fazer nada se há token OAuth
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, hasToken]);

  if (hasToken) {
    return <OAuthHandler />;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Sucesso */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6">
            <svg
              className="h-10 w-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bem-vindo!</h2>
          <p className="text-gray-600 mb-6">Login realizado com sucesso</p>
        </div>

        {/* Informações do usuário */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="text-center">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt="Avatar do usuário"
                width={64}
                height={64}
                className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                priority
              />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {session.user?.name || 'Usuário'}
            </h3>
            <p className="text-gray-600">{session.user?.email}</p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 text-center mb-4">
              Você está conectado e pode acessar todas as funcionalidades da plataforma.
            </p>

            <div className="space-y-3">
              <Link
                href="/dashboard"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 block text-center"
              >
                Ir para Dashboard
              </Link>

              <Link
                href="/logout"
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 block text-center"
              >
                Fazer Logout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <WelcomeContent />
    </Suspense>
  );
}
