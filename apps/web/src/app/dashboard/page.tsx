'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import OAuthHandler from '../../components/auth/OAuth-handler';

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Se há token na URL, usar o OAuth handler
  const hasToken = searchParams.get('token');

  // Mover redirecionamento para useEffect (evita erro React #130)
  useEffect(() => {
    if (hasToken) return; // Não fazer nada se há token OAuth
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router, hasToken]);
  
  if (hasToken) {
    return <OAuthHandler />;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <div className="ml-4 text-xl">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Dashboard - My WA API
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card de Boas-vindas */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">
                Bem-vindo!
              </h2>
              <p className="text-blue-600">
                Usuário: {session.user?.name || session.user?.email}
              </p>
            </div>

            {/* Card de Status */}
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                Status da API
              </h2>
              <p className="text-green-600">
                🟢 Operacional
              </p>
            </div>

            {/* Card de Instâncias */}
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h2 className="text-xl font-semibant text-purple-800 mb-2">
                Instâncias WhatsApp
              </h2>
              <p className="text-purple-600">
                0 instâncias ativas
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="mt-8 flex flex-wrap gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
              Nova Instância
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors">
              Enviar Mensagem
            </button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition-colors">
              Relatórios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Carregando dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}