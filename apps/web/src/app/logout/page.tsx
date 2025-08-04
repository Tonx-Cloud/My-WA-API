'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut({
          redirect: false,
          callbackUrl: '/login',
        });
        router.push('/login');
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        router.push('/login');
      }
    };

    handleLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Fazendo logout...</p>
      </div>
    </div>
  );
}
