import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Fazer chamada para o backend API
    const backendResponse = await fetch(`${process.env['BACKEND_URL']}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { success: false, error: errorData.error || 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    const data = await backendResponse.json()
    
    return NextResponse.json({
      success: true,
      user: data.user,
    })
  } catch (error) {
    console.error('Erro no login backend:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
