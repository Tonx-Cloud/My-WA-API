'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OAuthCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth Error:', error);
      window.location.href = '/login?error=' + error;
      return;
    }

    if (token) {
      // Salvar token no localStorage
      localStorage.setItem('jwt_token', token);

      // Validar token com o backend
      fetch('/api/auth/backend-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Usar redirecionamento direto para evitar middleware
            console.log('Token validado com sucesso, redirecionando...');
            window.location.href = '/dashboard/instances';
          } else {
            console.error('Token inválido:', data.error);
            window.location.href = '/login?error=invalid_token';
          }
        })
        .catch(error => {
          console.error('Erro ao validar token:', error);
          window.location.href = '/login?error=validation_error';
        });
    } else {
      // Sem token, redirecionar para login
      window.location.href = '/login?error=no_token';
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Processando autenticação...
          </h2>
          <p className="mt-2 text-sm text-gray-600">Aguarde enquanto validamos suas credenciais</p>
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}
