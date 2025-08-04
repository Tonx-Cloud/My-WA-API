'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular uma verificaÃ§Ã£o simples sem NextAuth
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Redirecionar para login sempre, sem verificar localStorage
      router.push('/login');
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <span className="text-white font-bold text-xl">WA</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My-wa-API</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Inicializando...</p>
        </div>
      </div>
    );
  }

  return null;
}
