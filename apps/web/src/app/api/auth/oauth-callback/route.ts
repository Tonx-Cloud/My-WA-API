import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { provider, providerId, email, name, avatar } = await request.json()

    // Fazer chamada para o backend API para OAuth
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/api/auth/oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        provider_id: providerId,
        email,
        name,
        avatar_url: avatar,
      }),
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { success: false, error: errorData.error || 'Erro no OAuth' },
        { status: 400 }
      )
    }

    const data = await backendResponse.json()
    
    return NextResponse.json({
      success: true,
      user: data.user,
    })
  } catch (error) {
    console.error('Erro no OAuth callback:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
