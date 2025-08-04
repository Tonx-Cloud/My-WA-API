'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
      });
    }
  }, [status, session, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch(
        `${process.env['NEXT_PUBLIC_API_URL']}/api/nextauth/update-profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            userId: session?.user?.id,
          }),
        }
      );

      if (response.ok) {
        // Atualizar sessÃ£o NextAuth
        await update({
          name: formData.name,
        });
        alert('Perfil atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao atualizar perfil');
    } finally {
      setIsUpdating(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ConfiguraÃ§Ãµes</h1>
          <p className="text-gray-600">Gerencie suas informaÃ§Ãµes de perfil</p>
        </div>

        {/* NavegaÃ§Ã£o */}
        <div className="flex justify-center space-x-4 mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-500 font-medium">
            â† Voltar ao Dashboard
          </Link>
        </div>

        {/* CartÃ£o de ConfiguraÃ§Ãµes */}
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* InformaÃ§Ãµes da Conta */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">InformaÃ§Ãµes da Conta</h2>

            <div className="flex items-center space-x-4">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt="Avatar do usuÃ¡rio"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                  priority
                />
              )}
              <div>
                <p className="text-sm text-gray-500">Logado como</p>
                <p className="font-medium text-gray-900">{session.user?.email}</p>
              </div>
            </div>
          </div>

          {/* FormulÃ¡rio de AtualizaÃ§Ã£o */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder="seu@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">O email nÃ£o pode ser alterado</p>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isUpdating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Atualizando...
                </div>
              ) : (
                'Atualizar Perfil'
              )}
            </button>
          </form>

          {/* SessÃ£o Info */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">InformaÃ§Ãµes da SessÃ£o</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-xs text-gray-600 overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>

          {/* AÃ§Ãµes */}
          <div className="border-t pt-4 space-y-3">
            <Link
              href="/logout"
              className="w-full bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 block text-center"
            >
              Fazer Logout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
