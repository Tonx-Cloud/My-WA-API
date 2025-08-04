import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Permitir todas as rotas de API, OAuth callback e assets estáticos
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/oauth/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('/favicon.ico') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password'
  ) {
    return NextResponse.next();
  }

  // Verificar se há token JWT na URL (OAuth callback)
  const hasJwtToken = searchParams.get('token');

  // Para rotas protegidas (dashboard, welcome), verificar autenticação
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/welcome')) {
    // Se há token JWT, permitir acesso (será processado pelo componente)
    if (hasJwtToken) {
      return NextResponse.next();
    }

    // Verificar se há token no localStorage via cookie/header
    // Para simplicidade, vamos permitir acesso e deixar os componentes lidarem
    return NextResponse.next();
  }

  // Outras rotas são públicas
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (all API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
