import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: number
  email: string
  name: string
  avatar_url?: string
  provider?: string
}

interface UseAuthReturn {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => void
  logout: () => void
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  isAuthenticated: boolean
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    
    // Remover do localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Remover cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    
    // Redirecionar para login
    router.push('/login')
  }, [router])

  const checkAuth = useCallback(() => {
    try {
      const savedToken = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (savedToken && savedUser) {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
        
        // Definir cookie para o middleware
        document.cookie = `token=${savedToken}; path=/; max-age=86400` // 24h
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    // Verificar autenticação ao carregar
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.token)
        setUser(data.user)
        
        // Salvar no localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Definir cookie para o middleware
        document.cookie = `token=${data.token}; path=/; max-age=86400` // 24h
        
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Erro no login' }
      }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Erro de conexão' }
    }
  }

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.token)
        setUser(data.user)
        
        // Salvar no localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Definir cookie para o middleware
        document.cookie = `token=${data.token}; path=/; max-age=86400` // 24h
        
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Erro no registro' }
      }
    } catch (error) {
      console.error('Erro no registro:', error)
      return { success: false, error: 'Erro de conexão' }
    }
  }

  const loginWithGoogle = () => {
    // Redirecionar para rota OAuth do Google
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`
  }

  return {
    user,
    token,
    loading,
    login,
    loginWithGoogle,
    logout,
    register,
    isAuthenticated: !!token && !!user
  }
}
