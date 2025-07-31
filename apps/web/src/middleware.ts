import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    
    // Verificar se é página de login e usuário já está logado
    if ((pathname === '/login' || pathname === '/register' || pathname === '/forgot-password') && req.nextauth.token) {
      // Redirecionar para dashboard se já estiver logado
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Rotas que requerem autenticação
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/welcome')) {
          return !!token
        }
        
        // Rotas de API protegidas
        if (pathname.startsWith('/api/protected')) {
          return !!token
        }

        // Outras rotas são públicas
        return true
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}

