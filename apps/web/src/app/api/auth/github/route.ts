import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Redirecionar para o backend OAuth
    const githubAuthUrl = `${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'}/api/auth/github`;

    return NextResponse.redirect(githubAuthUrl);
  } catch (error) {
    console.error('Error redirecting to GitHub OAuth:', error);
    return NextResponse.json({ error: 'Erro ao iniciar autenticaÃ§Ã£o GitHub' }, { status: 500 });
  }
}
