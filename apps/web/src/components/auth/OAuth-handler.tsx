'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function OAuthHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    
    if (token) {
      // Salvar token no localStorage para uso futuro
      localStorage.setItem('jwt_token', token)
      
      // Tentar fazer login automaticamente com o backend
      fetch('/api/auth/backend-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Se o backend validou o token, redirecionar para dashboard
          window.location.href = '/dashboard/instances'
        } else {
          console.error('Token inválido:', data.error)
          router.push('/login?error=invalid_token')
        }
      })
      .catch(error => {
        console.error('Erro ao validar token:', error)
        router.push('/login?error=validation_error')
      })
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Processando autenticação...</p>
      </div>
    </div>
  )
}
