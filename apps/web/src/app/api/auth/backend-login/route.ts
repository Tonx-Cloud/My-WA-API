import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Se há um token, validar o token JWT
    if (body.token) {
      try {
        // Fazer chamada para o backend para validar o token
        const backendResponse = await fetch(`${process.env['BACKEND_URL'] || 'http://localhost:3000'}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${body.token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!backendResponse.ok) {
          return NextResponse.json(
            { success: false, error: 'Token inválido' },
            { status: 401 }
          )
        }

        const userData = await backendResponse.json()
        
        return NextResponse.json({
          success: true,
          user: userData.user,
          token: body.token
        })
      } catch (error) {
        console.error('Erro ao validar token:', error)
        return NextResponse.json(
          { success: false, error: 'Erro ao validar token' },
          { status: 401 }
        )
      }
    }

    // Fluxo original de login com email/senha
    const { email, password } = body

    // Fazer chamada para o backend API
    const backendResponse = await fetch(`${process.env['BACKEND_URL'] || 'http://localhost:3000'}/api/auth/login`, {
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

