import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Redirecionar para o backend OAuth
    const googleAuthUrl = `${process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000'}/api/auth/google`
    
    return NextResponse.redirect(googleAuthUrl)
  } catch (error) {
    console.error('Error redirecting to Google OAuth:', error)
    return NextResponse.json(
      { error: 'Erro ao iniciar autenticação Google' }, 
      { status: 500 }
    )
  }
}

